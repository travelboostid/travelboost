<?php

namespace App\Ai\Agents\Concerns;

use App\Enums\BookingStatus;
use App\Enums\CompanyType;
use App\Enums\TourStatus;
use App\Events\ChatMessageUpdated;
use App\Events\ChatRoomUpdated;
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
use App\Models\TourSchedule;
use App\Services\TourScheduleDisplayPriceService;
use App\Support\NumericStringConfig;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Laravel\Ai\Embeddings;
use Laravel\Ai\Messages\Message;
use Laravel\Ai\Messages\MessageRole;
use Laravel\Ai\Responses\AgentResponse;
use Laravel\Ai\Responses\EmbeddingsResponse;

trait ProvidesChatbotContext
{
    public const CHATBOT_CONFIG_CACHE_KEY = 'app_config.chatbot.value';

    private const CHATBOT_CONFIG_CACHE_SECONDS = 300;

    private const RECENT_MESSAGE_LIMIT = 4;

    private const SUMMARIZE_BATCH_MIN_MESSAGES = 2;

    private const SUMMARY_TRANSCRIPT_CHAR_LIMIT = 200;

    private const TOUR_QUERY_RESULT_LIMIT = 3;

    private const KNOWLEDGE_BASE_RESULT_LIMIT = 2;

    private const BOOKING_QUERY_RESULT_LIMIT = 5;

    private const TOUR_SCHEDULE_QUERY_RESULT_LIMIT = 8;

    private const KNOWLEDGE_BASE_CHUNK_MAX_CHARS = 400;

    private const AI_MESSAGE_MAX_CHARS = 500;

    private const BOT_CONTEXT_MAX_STORE_CHARS = 1500;

    private const VECTOR_MIN_SIMILARITY = 0.1;

    private const STREAM_BROADCAST_INTERVAL_SECONDS = 0.15;

    protected bool $shouldRespond = false;

    protected ?ChatRoomMember $receiver = null;

    protected ?Company $company = null;

    protected ?AiCredit $credit = null;

    protected ?CompanySettings $settings = null;

    protected Collection $chatMessages;

    protected ?Collection $generalKnowledgeBaseOwnerIds = null;

    protected string $chatbotModelProvider = '';

    protected string $chatbotModelName = '';

    protected string $embeddingModelProvider = '';

    protected string $embeddingModelName = '';

    protected int $promptTokens = 0;

    protected int $completionTokens = 0;

    protected int $embeddingTokens = 0;

    protected string $promptTokenCostPerMillion = '0';

    protected string $completionTokenCostPerMillion = '0';

    protected string $embeddingTokenCostPerMillion = '0';

    protected string $userCostPerInteraction = '0';

    /**
     * @param  array<string, mixed>  $args
     */
    public function retrieveTourQueryContext(array $args): string
    {
        $keywords = trim((string) ($args['keywords'] ?? ''));
        $destination = trim((string) ($args['destination'] ?? ''));
        $tourCode = trim((string) ($args['tour_code'] ?? ''));

        $tours = $this->availableToursQuery()
            ->when(($args['tour_id'] ?? 0) > 0, fn (Builder $query) => $query->whereKey($args['tour_id']))
            ->when($tourCode !== '', fn (Builder $query) => $query->where('code', 'ilike', $this->ilikeTerm($tourCode)))
            ->when($destination !== '', fn (Builder $query) => $query->where('destination', 'ilike', $this->ilikeTerm($destination)))
            ->when(! empty($args['continents'] ?? []), fn (Builder $query) => $this->applyIlikeLocationFilter($query, 'continent_name', (array) $args['continents']))
            ->when(! empty($args['countries'] ?? []), fn (Builder $query) => $this->applyIlikeLocationFilter($query, 'country_name', (array) $args['countries']))
            ->when(! empty($args['regions'] ?? []), fn (Builder $query) => $this->applyIlikeLocationFilter($query, 'region_name', (array) $args['regions']))
            ->when(($args['duration_min'] ?? 0) > 0, fn (Builder $query) => $query->where('duration_days', '>=', (int) $args['duration_min']))
            ->when(($args['duration_max'] ?? 0) > 0, fn (Builder $query) => $query->where('duration_days', '<=', (int) $args['duration_max']))
            ->when(($args['price_min'] ?? 0) > 0, fn (Builder $query) => $query->where('showprice', '>=', $args['price_min']))
            ->when(($args['price_max'] ?? 0) > 0, fn (Builder $query) => $query->where('showprice', '<=', $args['price_max']))
            ->when($keywords !== '', fn (Builder $query) => $this->applyTourKeywordsFilter($query, $keywords))
            ->orderBy('name')
            ->limit(self::TOUR_QUERY_RESULT_LIMIT)
            ->get();

        if ($tours->isEmpty()) {
            return 'No tours matched.';
        }

        return "tours:id|code|name|days|dest|country|price\n".$tours
            ->map(fn (Tour $tour): string => implode('|', [
                $tour->id,
                $tour->code,
                $tour->name,
                $tour->duration_days,
                $tour->destination,
                $tour->country_name,
                $tour->showprice,
            ]))
            ->implode("\n");
    }

    /**
     * @param  array<string, mixed>  $args
     */
    public function retrieveTourDetailContext(array $args): string
    {
        $tourId = $args['tour_id'] ?? null;

        if (! $tourId && $this->message->attachment_type === 'tour') {
            $tourId = (int) $this->message->attachment_data;
        }

        $tour = Tour::query()->find($tourId);
        if (! $tour) {
            return '';
        }

        $ownerIds = collect();

        if ($tour->document_id) {
            $ownerIds = collect([$tour->document_id]);
        }

        $documentRows = $ownerIds->isNotEmpty()
            ? $this->searchKnowledgeBase($ownerIds, $tour->name)
            : '';

        $knowledge = $documentRows !== '' ? "\nkb:\n{$documentRows}" : '';

        return 'tour:id|code|name|days|dest|country|price'
            ."\n".implode('|', [
                $tour->id,
                $tour->code,
                $tour->name,
                $tour->duration_days,
                $tour->destination,
                $tour->country_name,
                $tour->showprice,
            ])
            .$knowledge;
    }

    /**
     * @param  array<string, mixed>  $args
     */
    public function retrieveTourSchedulesContext(array $args): string
    {
        $tourId = $args['tour_id'] ?? null;

        if (! $tourId && $this->message->attachment_type === 'tour') {
            $tourId = (int) $this->message->attachment_data;
        }

        if (! $tourId) {
            return '';
        }

        $tour = $this->availableToursQuery()->whereKey($tourId)->first();

        if (! $tour) {
            return 'No tour matched.';
        }

        $upcomingOnly = filter_var($args['upcoming_only'] ?? true, FILTER_VALIDATE_BOOL);
        $departureFrom = trim((string) ($args['departure_from'] ?? ''));
        $departureTo = trim((string) ($args['departure_to'] ?? ''));

        $schedules = TourSchedule::query()
            ->where('tour_id', $tour->id)
            ->where('is_active', true)
            ->when($upcomingOnly, fn (Builder $query) => $query->whereDate('departure_date', '>=', now()->toDateString()))
            ->when($departureFrom !== '', fn (Builder $query) => $query->whereDate('departure_date', '>=', $departureFrom))
            ->when($departureTo !== '', fn (Builder $query) => $query->whereDate('departure_date', '<=', $departureTo))
            ->with(['availability', 'prices.priceCategory'])
            ->orderBy('departure_date')
            ->orderBy('id')
            ->limit(self::TOUR_SCHEDULE_QUERY_RESULT_LIMIT)
            ->get();

        if ($schedules->isEmpty()) {
            return 'No schedules matched.';
        }

        $priceService = app(TourScheduleDisplayPriceService::class);

        $header = "tour:{$tour->id}|{$tour->code}|{$tour->name}\n"
            ."schedules:id|departure|return|available|price\n";

        $rows = $schedules
            ->map(fn (TourSchedule $schedule): string => implode('|', [
                $schedule->id,
                $schedule->departure_date,
                $schedule->return_date ?? '',
                $schedule->availability?->available ?? '',
                $priceService->resolve($schedule, $tour),
            ]))
            ->implode("\n");

        return $header.$rows;
    }

    /**
     * @param  array<string, mixed>  $args
     */
    public function retrieveBookingQueryContext(array $args): string
    {
        if ($this->message->sender_type !== 'user') {
            return '';
        }

        $tourId = $args['tour_id'] ?? null;

        if (! $tourId && $this->message->attachment_type === 'tour') {
            $tourId = (int) $this->message->attachment_data;
        }

        $keywords = trim((string) ($args['keywords'] ?? ''));
        $bookingNumber = trim((string) ($args['booking_number'] ?? ''));
        $statuses = $this->normalizeBookingStatusFilters((array) ($args['statuses'] ?? []));
        $upcomingOnly = filter_var($args['upcoming_only'] ?? false, FILTER_VALIDATE_BOOL);

        $bookings = Booking::query()
            ->with('tour')
            ->where('user_id', $this->message->sender_id)
            ->where('agent_id', $this->company->id)
            ->when(($tourId ?? 0) > 0, fn (Builder $query) => $query->where('tour_id', $tourId))
            ->when($bookingNumber !== '', fn (Builder $query) => $query->where('booking_number', 'ilike', $this->ilikeTerm($bookingNumber)))
            ->when($statuses !== [], fn (Builder $query) => $query->whereIn('status', $statuses))
            ->when(! empty($args['departure_from'] ?? null), fn (Builder $query) => $query->whereDate('departure_date', '>=', $args['departure_from']))
            ->when(! empty($args['departure_to'] ?? null), fn (Builder $query) => $query->whereDate('departure_date', '<=', $args['departure_to']))
            ->when($upcomingOnly, fn (Builder $query) => $query->whereDate('departure_date', '>=', now()->toDateString()))
            ->when($keywords !== '', fn (Builder $query) => $this->applyBookingKeywordsFilter($query, $keywords))
            ->orderByDesc('departure_date')
            ->orderByDesc('id')
            ->limit(self::BOOKING_QUERY_RESULT_LIMIT)
            ->get();

        if ($bookings->isEmpty()) {
            return 'No bookings matched.';
        }

        return "bookings:id|no|tour|departure|status|total\n".$bookings
            ->map(fn (Booking $booking): string => implode('|', [
                $booking->id,
                $booking->booking_number,
                $booking->tour?->name ?? '',
                $booking->departure_date,
                $this->formatBookingStatus($booking),
                $booking->total_price,
            ]))
            ->implode("\n");
    }

    /**
     * @param  array<string, mixed>  $args
     */
    public function retrieveBookingDetailContext(array $args): string
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

        return 'booking:id|no|tour|departure|status|total|adult|child|infant|contact|email'
            ."\n".implode('|', [
                $booking->id,
                $booking->booking_number,
                $booking->tour?->name ?? '',
                $booking->departure_date,
                $this->formatBookingStatus($booking),
                $booking->total_price,
                $booking->pax_adult,
                $booking->pax_child,
                $booking->pax_infant,
                $booking->contact_name,
                $booking->contact_email,
            ]);
    }

    /**
     * @param  array<string, mixed>  $args
     */
    public function retrieveGeneralContext(array $args): string
    {
        $query = trim((string) ($args['query'] ?? ''));
        if ($query === '') {
            $query = $this->message->message;
        }

        return $this->searchKnowledgeBase($this->generalKnowledgeBaseOwnerIds(), $query);
    }

    public function retrieveCompanyContactContext(): string
    {
        if (! $this->company) {
            return '';
        }

        $csPhone = $this->company->customer_service_phone ?: $this->company->phone;

        return 'company:name|email|address|cs_phone'
            ."\n".implode('|', [
                $this->company->name,
                $this->company->email,
                $this->company->address,
                $csPhone,
            ]);
    }

    protected function setupChatbotContext(): void
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

        $this->refreshConversationSummaryIfNeeded();

        $this->chatMessages = $this->message->room->messages()
            ->where('id', '<=', $this->message->id)
            ->latest()
            ->take(self::RECENT_MESSAGE_LIMIT)
            ->get()
            ->filter(fn (ChatMessage $message): bool => ! $message->is_bot || trim((string) $message->message) !== '')
            ->reverse()
            ->values();

        $this->shouldRespond = true;
    }

    protected function createBotPlaceholderMessage(): ChatMessage
    {
        $botMessage = ChatMessage::query()->create([
            'room_id' => $this->message->room_id,
            'sender_type' => 'company',
            'sender_id' => $this->company->id,
            'message' => '',
            'is_bot' => true,
            'meta' => ['streaming' => true],
        ]);

        return $botMessage->load(['sender', 'room']);
    }

    protected function updateStreamingBotMessage(ChatMessage $message, string $text, bool $streaming): ChatMessage
    {
        $meta = array_merge($message->meta ?? [], ['streaming' => $streaming]);

        $message->update([
            'message' => $text,
            'meta' => $meta,
        ]);

        return $message->fresh(['sender', 'room']);
    }

    protected function finalizeStreamingBotMessage(
        ChatMessage $message,
        string $text,
        ?string $botContext = null,
    ): ChatMessage {
        $meta = array_merge($message->meta ?? [], ['streaming' => false]);

        if ($botContext !== null && $botContext !== '') {
            $meta['bot-context'] = $this->truncateForModel($botContext, self::BOT_CONTEXT_MAX_STORE_CHARS);
        }

        $message->update([
            'message' => $text,
            'meta' => $meta,
        ]);

        $fresh = $message->fresh(['sender', 'room']);

        $this->broadcastBotMessageUpdate($fresh);
        $this->updateChatRoomLastMessage($fresh);

        return $fresh;
    }

    protected function updateChatRoomLastMessage(ChatMessage $message): void
    {
        $message->room()->update(['last_message_id' => $message->id]);

        $room = $message->room()->with(['lastMessage', 'members'])->first();

        if ($room !== null) {
            broadcast(new ChatRoomUpdated($room));
        }
    }

    protected function broadcastBotMessageUpdate(ChatMessage $message): void
    {
        broadcast(new ChatMessageUpdated($message->loadMissing(['sender', 'room'])));
    }

    protected function saveUsageLog(): bool
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
                'meta' => [
                    'chat_message_id' => $this->message->id,
                    'room_id' => $this->message->room_id,
                ],
            ]);

            return true;
        });
    }

    protected function trackTokenUsage(EmbeddingsResponse|AgentResponse $response): void
    {
        if ($response instanceof EmbeddingsResponse) {
            $this->embeddingTokens += $response->tokens ?? 0;

            return;
        }

        $usage = $response->usage;

        $this->promptTokens += ($usage->promptTokens ?? 0) + ($usage->cacheReadInputTokens ?? 0);
        $this->completionTokens += ($usage->completionTokens ?? 0)
            + ($usage->reasoningTokens ?? 0)
            + ($usage->cacheWriteInputTokens ?? 0);
    }

    protected function hasConfiguredModels(): bool
    {
        return $this->chatbotModelProvider !== ''
            && $this->chatbotModelName !== ''
            && $this->embeddingModelProvider !== ''
            && $this->embeddingModelName !== '';
    }

    protected function toAiMessage(ChatMessage $chatMessage, bool $includeBotContext = false): Message
    {
        $content = $this->truncateForModel(trim((string) $chatMessage->message));

        if ($chatMessage->attachment_type === 'tour' && $chatMessage->attachment_data) {
            $content .= "\n[Attached tour_id: {$chatMessage->attachment_data}]";
        }

        if ($includeBotContext) {
            $context = data_get($chatMessage->meta, 'bot-context');
            if (is_string($context) && $context !== '') {
                $content .= "\n---\nAdditional context:\n".$this->truncateForModel($context, self::BOT_CONTEXT_MAX_STORE_CHARS);
            }
        }

        return new Message(
            $chatMessage->is_bot ? MessageRole::Assistant : MessageRole::User,
            $content,
        );
    }

    protected function truncateForModel(string $text, ?int $maxChars = null): string
    {
        $maxChars ??= self::AI_MESSAGE_MAX_CHARS;

        if ($maxChars <= 0 || mb_strlen($text) <= $maxChars) {
            return $text;
        }

        return rtrim(mb_substr($text, 0, max(0, $maxChars - 1))).'…';
    }

    /**
     * @return Builder<Tour>
     */
    private function availableToursQuery(): Builder
    {
        $query = Tour::query()->where('status', TourStatus::ACTIVE);

        if ($this->company->type === CompanyType::AGENT) {
            $agentTourIds = $this->company->agentTours()
                ->where('status', TourStatus::ACTIVE)
                ->pluck('tour_id');

            return $query->where(function (Builder $query) use ($agentTourIds): void {
                $query->where('company_id', $this->company->id)
                    ->orWhereIn('id', $agentTourIds);
            });
        }

        return $query->where('company_id', $this->company->id);
    }

    /**
     * @param  Builder<Tour>  $query
     * @param  list<string>  $values
     */
    private function applyIlikeLocationFilter(Builder $query, string $column, array $values): void
    {
        $values = array_values(array_filter(array_map(
            fn (mixed $value): string => trim((string) $value),
            $values,
        )));

        if ($values === []) {
            return;
        }

        $query->where(function (Builder $query) use ($column, $values): void {
            foreach ($values as $value) {
                $query->orWhere($column, 'ilike', $this->ilikeTerm($value));
            }
        });
    }

    /**
     * @param  Builder<Tour>  $query
     */
    private function applyTourKeywordsFilter(Builder $query, string $keywords): void
    {
        $tokens = preg_split('/\s+/u', $keywords, -1, PREG_SPLIT_NO_EMPTY) ?: [];

        foreach ($tokens as $token) {
            $term = $this->ilikeTerm($token);

            $query->where(function (Builder $query) use ($term): void {
                $query->where('name', 'ilike', $term)
                    ->orWhere('code', 'ilike', $term)
                    ->orWhere('destination', 'ilike', $term)
                    ->orWhere('country_name', 'ilike', $term)
                    ->orWhere('region_name', 'ilike', $term)
                    ->orWhere('continent_name', 'ilike', $term)
                    ->orWhere('description', 'ilike', $term);
            });
        }
    }

    /**
     * @param  Builder<Booking>  $query
     */
    private function applyBookingKeywordsFilter(Builder $query, string $keywords): void
    {
        $tokens = preg_split('/\s+/u', $keywords, -1, PREG_SPLIT_NO_EMPTY) ?: [];

        foreach ($tokens as $token) {
            $term = $this->ilikeTerm($token);

            $query->where(function (Builder $query) use ($term): void {
                $query->where('booking_number', 'ilike', $term)
                    ->orWhereHas('tour', function (Builder $query) use ($term): void {
                        $query->where('name', 'ilike', $term)
                            ->orWhere('code', 'ilike', $term)
                            ->orWhere('destination', 'ilike', $term);
                    });
            });
        }
    }

    /**
     * @param  list<mixed>  $statuses
     * @return list<string>
     */
    private function normalizeBookingStatusFilters(array $statuses): array
    {
        $normalized = [];

        foreach ($statuses as $status) {
            $needle = strtolower(trim((string) $status));

            if ($needle === '') {
                continue;
            }

            foreach (BookingStatus::cases() as $case) {
                if (strtolower($case->value) === $needle) {
                    $normalized[] = $case->value;
                }
            }
        }

        return array_values(array_unique($normalized));
    }

    private function ilikeTerm(string $value): string
    {
        return '%'.addcslashes(trim($value), '%_\\').'%';
    }

    /**
     * @param  Collection<int, int|string>  $ownerIds
     */
    private function searchKnowledgeBase(Collection $ownerIds, string $query): string
    {
        if ($ownerIds->isEmpty()) {
            return '';
        }

        $embedded = Embeddings::for([$query])
            ->cache()
            ->generate(
                provider: $this->embeddingModelProvider,
                model: $this->embeddingModelName,
            );

        $this->trackTokenUsage($embedded);

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
            ->map(fn (string $document): string => '- '.$this->truncateForModel(trim($document), self::KNOWLEDGE_BASE_CHUNK_MAX_CHARS))
            ->implode("\n");
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

    private function formatBookingStatus(Booking $booking): string
    {
        $status = $booking->status;

        if ($status instanceof BookingStatus) {
            return $status->value;
        }

        return (string) ($status ?? '');
    }
}
