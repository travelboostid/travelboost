<?php

namespace App\Ai\Agents;

use App\Enums\BookingStatus;
use App\Enums\CompanyType;
use App\Enums\TourStatus;
use App\Models\AiCredit;
use App\Models\AiUsageLog;
use App\Models\AppConfig;
use App\Models\Booking;
use App\Models\ChatMessage;
use App\Models\ChatRoomMember;
use App\Models\Company;
use App\Models\CompanySettings;
use App\Models\KnowledgeBase;
use App\Models\Media;
use App\Models\Tour;
use App\Support\NumericStringConfig;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Embeddings;
use Laravel\Ai\Messages\Message;
use Laravel\Ai\Messages\MessageRole;
use Laravel\Ai\Promptable;
use Laravel\Ai\Responses\AgentResponse;
use Laravel\Ai\Responses\EmbeddingsResponse;
use Stringable;

use function Laravel\Ai\agent;

class ChatbotAgent implements Agent, Conversational
{
    use Promptable;

    public const CHATBOT_CONFIG_CACHE_KEY = 'app_config.chatbot.value';

    private const CHATBOT_CONFIG_CACHE_SECONDS = 300;

    private const RECENT_MESSAGE_LIMIT = 10;

    private const INTENT_MESSAGE_LIMIT = 5;

    private const KNOWLEDGE_BASE_RESULT_LIMIT = 3;

    private const BOOKING_QUERY_RESULT_LIMIT = 10;

    private const VECTOR_MIN_SIMILARITY = 0.1;

    private bool $shouldRespond = false;

    private ?ChatRoomMember $receiver = null;

    private ?Company $company = null;

    private ?AiCredit $credit = null;

    private ?CompanySettings $settings = null;

    private Collection $chatMessages;

    private ?Collection $generalKnowledgeBaseOwnerIds = null;

    private string $chatbotModelProvider = '';

    private string $chatbotModelName = '';

    private string $embeddingModelProvider = '';

    private string $embeddingModelName = '';

    private int $promptTokens = 0;

    private int $completionTokens = 0;

    private int $embeddingTokens = 0;

    private string $promptTokenCostPerMillion = '0';

    private string $completionTokenCostPerMillion = '0';

    private string $embeddingTokenCostPerMillion = '0';

    private string $userCostPerInteraction = '0';

    public function __construct(private ChatMessage $message)
    {
        $this->chatMessages = collect();
        $this->setup();
    }

    public function instructions(): Stringable|string
    {
        return <<<'PROMPT'
        You are a helpful professional chatbot that answers user questions.

        Rules:
        - Answer like in a casual conversation.
        - Use ONLY the provided context to answer.
        - If the answer is not in the context, say you don't know.
        - Don't say "context not provided" or similar phrases.
        - Do not guess or make up information.
        - Keep answers short, clear, and helpful.
        - If unclear, ask for clarification.
        - Do not mention internal systems or processes.

        You MUST detect the language of the user's message and reply in that EXACT same language.
        PROMPT;
    }

    public function messages(): array
    {
        return $this->chatMessages
            ->map(fn (ChatMessage $chatMessage): Message => $this->toAiMessage($chatMessage))
            ->all();
    }

    public function reply(): void
    {
        if (! $this->shouldRespond || ! $this->hasConfiguredModels()) {
            return;
        }

        ['context' => $context] = $this->retrieveChatContext();

        $prompt = 'Respond message in a helpful way.';
        if ($context !== '') {
            $prompt .= " See the additional context below.\n---\n{$context}";
        }

        $response = $this->prompt(
            prompt: $prompt,
            provider: $this->chatbotModelProvider,
            model: $this->chatbotModelName,
        );

        $this->trackTokenUsage($response);

        if (! $this->saveUsageLog()) {
            return;
        }

        $this->saveBotMessage($response->text, ['meta' => ['bot-context' => $context]]);
    }

    /**
     * @return array{intent: string, args: array<string, mixed>, context: string}
     */
    private function retrieveChatContext(): array
    {
        $attachedTourId = $this->message->attachment_type === 'tour'
            ? (int) $this->message->attachment_data
            : null;

        $prompt = <<<'PROMPT'
        Analyze the user messages and detect intent:
        - tour_detail(tour_id): looking for specific tour information.
        - tour_query(...args): looking for tours based on criteria, including optional keywords for free-text search.
        - booking_query(tour_id): looking for their own bookings, optionally for a specific tour.
        - booking_detail(booking_id): looking for specific booking information.
        - general(): general travel questions.

        If the current message has a tour attachment, use that tour_id in args when intent is tour_detail or booking_query.
        Questions about booking status, payment, or "my booking" with a tour attached should be booking_query, not tour_detail.
        For tour_query, put destination names, tour themes, or other free-text search terms in args.keywords.
        PROMPT;

        if ($attachedTourId) {
            $prompt .= "\n\nThe current message has an attached tour_id: {$attachedTourId}.";
        }

        $response = agent(
            instructions: 'You are an assistant that retrieves relevant context from recent chat messages to help understand the user\'s current message.',
            messages: $this->chatMessages
                ->take(-self::INTENT_MESSAGE_LIMIT)
                ->map(fn (ChatMessage $chatMessage): Message => $this->toAiMessage($chatMessage, includeBotContext: true))
                ->all(),
            schema: fn (JsonSchema $schema): array => [
                'intent' => $schema->string()
                    ->enum(['tour_detail', 'tour_query', 'booking_query', 'booking_detail', 'general'])
                    ->required(),
                'args' => $schema->object([
                    'tour_id' => $schema->integer(),
                    'booking_id' => $schema->integer(),
                    'continents' => $schema->array()->items($schema->string()),
                    'countries' => $schema->array()->items($schema->string()),
                    'duration_min' => $schema->integer(),
                    'duration_max' => $schema->integer(),
                    'price_min' => $schema->number(),
                    'price_max' => $schema->number(),
                    'keywords' => $schema->string(),
                ])->withoutAdditionalProperties(),
            ],
        )->prompt(
            prompt: $prompt,
            provider: $this->chatbotModelProvider,
            model: $this->chatbotModelName,
        );

        $this->trackTokenUsage($response);

        $intent = $response['intent'] ?? 'general';
        $args = $response['args'] ?? [];

        if ($attachedTourId && in_array($intent, ['tour_detail', 'booking_query'], true)) {
            $args['tour_id'] ??= $attachedTourId;
        }

        $context = match ($intent) {
            'tour_detail' => $this->retrieveTourDetailContext($args),
            'tour_query' => $this->retrieveTourQueryContext($args),
            'booking_query' => $this->retrieveBookingQueryContext($args),
            'booking_detail' => $this->retrieveBookingDetailContext($args),
            default => $this->retrieveGeneralContext($args),
        };

        return [
            'intent' => $intent,
            'args' => $args,
            'context' => $context,
        ];
    }

    private function retrieveTourQueryContext(array $args): string
    {
        $keywords = trim((string) ($args['keywords'] ?? ''));

        $tours = $this->availableToursQuery()
            ->when(! empty($args['continents'] ?? []), fn ($query) => $query->whereIn('continent_name', $args['continents']))
            ->when(! empty($args['countries'] ?? []), fn ($query) => $query->whereIn('country_name', $args['countries']))
            ->when(($args['duration_min'] ?? 0) > 0, fn ($query) => $query->where('duration_days', '>=', $args['duration_min']))
            ->when(($args['duration_max'] ?? 0) > 0, fn ($query) => $query->where('duration_days', '<=', $args['duration_max']))
            ->when(($args['price_min'] ?? 0) > 0, fn ($query) => $query->where('showprice', '>=', $args['price_min']))
            ->when(($args['price_max'] ?? 0) > 0, fn ($query) => $query->where('showprice', '<=', $args['price_max']))
            ->when($keywords !== '', fn ($query) => $this->applyTourKeywordsFilter($query, $keywords))
            ->limit(5)
            ->get();

        if ($tours->isEmpty()) {
            return 'No relevant tours found in the system based on the search criteria.';
        }

        $rows = $tours
            ->map(fn (Tour $tour): string => "| {$tour->id} | {$tour->code} | {$tour->name} | {$tour->duration_days} | {$tour->destination} | {$tour->country_name} | {$tour->showprice} |")
            ->implode("\n");

        return <<<CONTEXT
        Based on the search criteria, here are some relevant tours from the system:
        | id | code | name | duration_days | destination | country_name | price |
        |----|------|------|---------------|-------------|--------------|-------|
        {$rows}
        CONTEXT;
    }

    /**
     * @return Builder<Tour>
     */
    private function availableToursQuery(): Builder
    {
        if ($this->company->type === CompanyType::AGENT) {
            $agentTourIds = $this->company->agentTours()
                ->where('status', TourStatus::ACTIVE)
                ->pluck('tour_id');

            return Tour::query()->where(function (Builder $query) use ($agentTourIds): void {
                $query->where('company_id', $this->company->id)
                    ->orWhereIn('id', $agentTourIds);
            });
        }

        return Tour::query()->where('company_id', $this->company->id);
    }

    /**
     * @param  Builder<Tour>  $query
     */
    private function applyTourKeywordsFilter($query, string $keywords): void
    {
        $term = '%'.addcslashes($keywords, '%_\\').'%';

        $query->where(function ($query) use ($term): void {
            $query->where('name', 'ilike', $term)
                ->orWhere('code', 'ilike', $term)
                ->orWhere('destination', 'ilike', $term)
                ->orWhere('country_name', 'ilike', $term)
                ->orWhere('region_name', 'ilike', $term)
                ->orWhere('continent_name', 'ilike', $term)
                ->orWhere('description', 'ilike', $term);
        });
    }

    private function retrieveGeneralContext(array $args): string
    {
        return $this->searchKnowledgeBase($this->generalKnowledgeBaseOwnerIds());
    }

    private function retrieveTourDetailContext(array $args): string
    {
        $tour = Tour::query()->find($args['tour_id'] ?? null);
        if (! $tour) {
            return '';
        }

        $ownerIds = $this->generalKnowledgeBaseOwnerIds();
        if ($tour->document_id) {
            $ownerIds = $ownerIds->prepend($tour->document_id)->unique()->values();
        }

        $documentRows = $this->searchKnowledgeBase($ownerIds);
        $relevantKnowledges = $documentRows !== ''
            ? "Relevant information about the tour has been retrieved from the system:\n{$documentRows}"
            : '';

        return <<<CONTEXT
        Tour details retrieved from system:
        | id | code | name | duration_days | destination | country_name | price |
        |----|------|------|---------------|-------------|--------------|-------|
        | {$tour->id} | {$tour->code} | {$tour->name} | {$tour->duration_days} | {$tour->destination} | {$tour->country_name} | {$tour->showprice} |

        {$relevantKnowledges}
        CONTEXT;
    }

    private function retrieveBookingQueryContext(array $args): string
    {
        $bookings = Booking::query()
            ->with('tour')
            ->where('user_id', $this->message->sender_id)
            ->where('agent_id', $this->company->id)
            ->when(($args['tour_id'] ?? 0) > 0, fn ($query) => $query->where('tour_id', $args['tour_id']))
            ->orderByDesc('created_at')
            ->limit(self::BOOKING_QUERY_RESULT_LIMIT)
            ->get();

        if ($bookings->isEmpty()) {
            return 'No bookings found for this customer with this company.';
        }

        $rows = $bookings
            ->map(fn (Booking $booking): string => "| {$booking->id} | {$booking->booking_number} | {$booking->tour?->name} | {$booking->departure_date} | {$this->formatBookingStatus($booking)} | {$booking->total_price} |")
            ->implode("\n");

        return <<<CONTEXT
        Here are bookings from the system for context:
        | id | booking_number | tour_name | departure_date | status | total_price |
        |----|----------------|-----------|----------------|--------|-------------|
        {$rows}
        CONTEXT;
    }

    private function retrieveBookingDetailContext(array $args): string
    {
        if ($this->message->sender_type !== 'user') {
            return '';
        }

        $bookingId = $args['booking_id'] ?? null;
        if (! $bookingId) {
            return '';
        }

        $booking = Booking::query()->with('tour')->find($bookingId);
        if (! $booking) {
            return '';
        }

        if ($booking->user_id !== $this->message->sender_id || $booking->agent_id !== $this->company->id) {
            return '';
        }

        return <<<CONTEXT
        Booking details retrieved from system:
        | id | booking_number | tour_name | departure_date | status | total_price | pax_adult | pax_child | pax_infant | contact_name | contact_email |
        |----|----------------|-----------|----------------|--------|-------------|-----------|-----------|-----------|--------------|----------------|
        | {$booking->id} | {$booking->booking_number} | {$booking->tour?->name} | {$booking->departure_date} | {$this->formatBookingStatus($booking)} | {$booking->total_price} | {$booking->pax_adult} | {$booking->pax_child} | {$booking->pax_infant} | {$booking->contact_name} | {$booking->contact_email} |
        CONTEXT;
    }

    /**
     * @param  Collection<int, int|string>  $ownerIds
     */
    private function searchKnowledgeBase(Collection $ownerIds): string
    {
        if ($ownerIds->isEmpty()) {
            return '';
        }

        $embedded = $this->embedUserMessage();
        $vector = $embedded->embeddings[0] ?? null;

        if ($vector === null) {
            return '';
        }

        $documents = KnowledgeBase::query()
            ->whereVectorSimilarTo('embedding', $vector, minSimilarity: self::VECTOR_MIN_SIMILARITY)
            ->where('owner_type', Media::class)
            ->whereIn('owner_id', $ownerIds)
            ->limit(self::KNOWLEDGE_BASE_RESULT_LIMIT)
            ->pluck('content');

        if ($documents->isEmpty()) {
            return '';
        }

        return $documents
            ->map(fn (string $document): string => "- {$document}")
            ->implode("\n");
    }

    private function embedUserMessage(): EmbeddingsResponse
    {
        $embedded = Embeddings::for([$this->message->message])
            ->cache()
            ->generate(
                provider: $this->embeddingModelProvider,
                model: $this->embeddingModelName,
            );

        $this->trackTokenUsage($embedded);

        return $embedded;
    }

    /**
     * @return Collection<int, int>
     */
    private function generalKnowledgeBaseOwnerIds(): Collection
    {
        if ($this->generalKnowledgeBaseOwnerIds !== null) {
            return $this->generalKnowledgeBaseOwnerIds;
        }

        $this->generalKnowledgeBaseOwnerIds = Media::query()
            ->where('subtype', 'general-knowledge-base-document')
            ->pluck('id');

        return $this->generalKnowledgeBaseOwnerIds;
    }

    private function saveBotMessage(string $message, array $additionalData = []): void
    {
        ChatMessage::query()->create(array_merge([
            'room_id' => $this->message->room_id,
            'sender_type' => 'company',
            'sender_id' => $this->company->id,
            'message' => $message,
            'is_bot' => true,
        ], $additionalData));
    }

    private function saveUsageLog(): bool
    {
        $usageCost = $this->getUsageCost();
        $userCost = $this->userCostPerInteraction;

        return (bool) DB::transaction(function () use ($userCost, $usageCost): bool {
            $credit = AiCredit::query()
                ->whereKey($this->credit->id)
                ->lockForUpdate()
                ->first();

            if (! $credit || bccomp((string) $credit->balance, $userCost, 10) < 0) {
                return false;
            }

            $credit->decrement('balance', $userCost);

            AiUsageLog::query()->create([
                'company_id' => $this->company->id,
                'embedding_tokens' => $this->embeddingTokens,
                'prompt_tokens' => $this->promptTokens,
                'completion_tokens' => $this->completionTokens,
                'usage_cost' => $usageCost,
                'user_cost' => $userCost,
                'feature' => 'chatbot',
            ]);

            return true;
        });
    }

    private function getUsageCost(): string
    {
        $promptTokenCost = bcmul(
            bcdiv((string) $this->promptTokens, '1000000', 16),
            $this->promptTokenCostPerMillion,
            16,
        );
        $completionTokenCost = bcmul(
            bcdiv((string) $this->completionTokens, '1000000', 16),
            $this->completionTokenCostPerMillion,
            16,
        );
        $embeddingTokenCost = bcmul(
            bcdiv((string) $this->embeddingTokens, '1000000', 16),
            $this->embeddingTokenCostPerMillion,
            16,
        );

        return bcadd(bcadd($promptTokenCost, $completionTokenCost, 16), $embeddingTokenCost, 16);
    }

    private function trackTokenUsage(EmbeddingsResponse|AgentResponse $response): void
    {
        if ($response instanceof EmbeddingsResponse) {
            $this->embeddingTokens += $response->tokens ?? 0;

            return;
        }

        $this->promptTokens += $response->usage->promptTokens ?? 0;
        $this->completionTokens += $response->usage->completionTokens ?? 0;
    }

    private function setup(): void
    {
        if (! $this->loadChatbotConfig()) {
            return;
        }

        if ($this->message->is_bot || $this->message->room->type !== 'private') {
            return;
        }

        if (! $this->resolveCompanyContext()) {
            return;
        }

        if (! $this->hasSufficientCredit()) {
            return;
        }

        $this->settings = $this->company->settings;

        if (! $this->settings?->chatbot_enabled) {
            return;
        }

        $this->chatMessages = $this->message->room->messages()
            ->latest()
            ->take(self::RECENT_MESSAGE_LIMIT)
            ->get()
            ->reverse()
            ->values();

        $this->shouldRespond = true;
    }

    private function loadChatbotConfig(): bool
    {
        $config = Cache::remember(
            self::CHATBOT_CONFIG_CACHE_KEY,
            self::CHATBOT_CONFIG_CACHE_SECONDS,
            fn (): ?array => AppConfig::query()->where('key', 'chatbot')->value('value'),
        );

        if (! is_array($config)) {
            return false;
        }

        $this->chatbotModelProvider = (string) ($config['chatbot_model_provider'] ?? '');
        $this->chatbotModelName = (string) ($config['chatbot_model_name'] ?? '');
        $this->embeddingModelProvider = (string) ($config['embedding_model_provider'] ?? '');
        $this->embeddingModelName = (string) ($config['embedding_model_name'] ?? '');
        $this->promptTokenCostPerMillion = NumericStringConfig::normalize($config['prompt_token_cost_per_million'] ?? null);
        $this->completionTokenCostPerMillion = NumericStringConfig::normalize($config['completion_token_cost_per_million'] ?? null);
        $this->embeddingTokenCostPerMillion = NumericStringConfig::normalize($config['embedding_token_cost_per_million'] ?? null);
        $this->userCostPerInteraction = NumericStringConfig::normalize($config['user_cost_per_interaction'] ?? null);

        return true;
    }

    private function resolveCompanyContext(): bool
    {
        $members = $this->message->room->members;

        $sender = $members->first(
            fn (ChatRoomMember $member): bool => $member->member_id === $this->message->sender_id
                && $member->member_type === $this->message->sender_type,
        );

        $this->receiver = $members->first(
            fn (ChatRoomMember $member): bool => $member->id !== $sender?->id,
        );

        $member = $this->receiver?->member;
        $this->company = $this->receiver?->member_type === 'company' && $member instanceof Company
            ? $member
            : null;

        if (! $this->company) {
            return false;
        }

        $this->credit = $this->company->aiCredit()->first();

        return $this->credit !== null;
    }

    private function hasSufficientCredit(): bool
    {
        return bccomp((string) $this->credit->balance, $this->userCostPerInteraction, 10) >= 0;
    }

    private function hasConfiguredModels(): bool
    {
        return $this->chatbotModelProvider !== ''
            && $this->chatbotModelName !== ''
            && $this->embeddingModelProvider !== ''
            && $this->embeddingModelName !== '';
    }

    private function formatBookingStatus(Booking $booking): string
    {
        $status = $booking->status;

        if ($status instanceof BookingStatus) {
            return $status->value;
        }

        return (string) ($status ?? '');
    }

    private function toAiMessage(ChatMessage $chatMessage, bool $includeBotContext = false): Message
    {
        $content = $chatMessage->message;

        if ($chatMessage->attachment_type === 'tour' && $chatMessage->attachment_data) {
            $content .= "\n[Attached tour_id: {$chatMessage->attachment_data}]";
        }

        if ($includeBotContext) {
            $context = data_get($chatMessage->meta, 'bot-context');
            if (is_string($context) && $context !== '') {
                $content .= "\n---\nAdditional context:\n{$context}";
            }
        }

        return new Message(
            $chatMessage->is_bot ? MessageRole::Assistant : MessageRole::User,
            $content,
        );
    }
}
