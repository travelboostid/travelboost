<?php

namespace App\Ai\Agents;

use App\Models\AiCredit;
use App\Models\AiUsageLog;
use App\Models\AppConfig;
use App\Models\Booking;
use App\Models\ChatMessage;
use App\Models\ChatRoomMember;
use App\Models\Company;
use App\Models\CompanySettings;
use App\Models\Tour;
use App\Models\TourDocumentKnowledgeBase;
use App\Models\User;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Embeddings;
use Laravel\Ai\Messages\Message;
use Laravel\Ai\Messages\MessageRole;
use Laravel\Ai\Promptable;
use Laravel\Ai\Responses\AgentResponse;
use Laravel\Ai\Responses\EmbeddingsResponse;

use function Laravel\Ai\{agent};
use Stringable;

class ChatbotAgent implements Agent, Conversational
{
  use Promptable;

  private bool $shouldRespond = false; // Flag to determine if the bot should respond
  private ChatRoomMember $receiver;
  private ?Company $company = null; // The company associated with the chat
  private ?AiCredit $credit = null; // Cached AI credit information for the company
  private ?CompanySettings $settings = null; // Cached company settings
  private ?Collection $chatMessages = null; // Cache for raw chat messages
  private string $chatbotModelProvider = ''; // Cached chatbot model provider
  private string $chatbotModelName = ''; // Cached chatbot model name
  private string $embeddingModelProvider = ''; // Cached embeddings model provider
  private string $embeddingModelName = ''; // Cached embeddings model name
  private int $promptTokens = 0;
  private int $completionTokens = 0;
  private int $embeddingTokens = 0;
  private string $promptTokenCostPerMillion = '100'; // Cost per million prompt tokens
  private string $completionTokenCostPerMillion = '200'; // Cost per million completion tokens
  private string $embeddingTokenCostPerMillion = '50'; // Cost per million embedding tokens
  private string $userCostPerInteraction = '0'; // Fixed cost per interaction for the user
  private function getUsageCost(): string
  {
    $promptTokenCost = bcmul(bcdiv((string) $this->promptTokens, '1000000', 16), $this->promptTokenCostPerMillion, 16);
    $completionTokenCost = bcmul(bcdiv((string) $this->completionTokens, '1000000', 16), $this->completionTokenCostPerMillion, 16);
    $embeddingTokenCost = bcmul(bcdiv((string) $this->embeddingTokens, '1000000', 16), $this->embeddingTokenCostPerMillion, 16);
    return bcadd(bcadd($promptTokenCost, $completionTokenCost, 16), $embeddingTokenCost, 16);
  }

  public function __construct(private ChatMessage $message)
  {
    $this->setup();
  }

  public function instructions(): Stringable|string
  {
    return <<<PROMPT
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
    return $this->chatMessages->map(function ($m) {
      $content = $m->message;
      return new Message($m->is_bot ? MessageRole::Assistant : MessageRole::User, $content);
    })->toArray();
  }

  public function reply()
  {
    if (!$this->shouldRespond) return;
    ['context' => $context] = $this->retrieveChatContext();

    $prompt = "Respond message in a helpful way. See the additional context below.\n---\n$context";

    $response = $this->prompt(
      prompt: $prompt,
      provider: $this->chatbotModelProvider,
      model: $this->chatbotModelName,
    );
    $this->trackTokenUsage($response);
    $this->saveBotMessage($response->text, ['meta' => ['bot-context' => $context]]);

    $this->saveUsageLog();
  }

  private function retrieveChatContext()
  {
    if ($this->message->attachment_type == 'tour') {
      $context = $this->retrieveTourDetailContext(['tour_id' => $this->message->attachment_data]);
      return [
        'intent' => 'detail',
        'args' => ['tour_id' => $this->message->attachment_data ?? null],
        'context' => $context,
      ];
    }
    $prompt = <<<PROMPT
      Analyze the user messages and detect intent:
      - tour_detail(tour_id): looking for specific tour information.
      - tour_query(...args): looking for tours based on criteria.
      - my_bookings(): looking for their own bookings.
      - booking_detail(booking_id): looking for specific booking information.
      - general(): general travel questions.
      PROMPT;

    $response = agent(
      instructions: "You are an assistant that retrieves relevant context from recent chat messages to help understand the user's current message.",
      messages: $this->chatMessages->take(-5)->map(function ($m) {
        $content = $m->message;
        $context = data_get($m->meta, 'bot-context');
        if ($context) {
          $content .= "\n---\nAdditional context:\n{$context}";
        }
        return new Message($m->is_bot ? MessageRole::Assistant : MessageRole::User, $content);
      })->toArray(), // Take the last 5 messages for context
      schema: function (JsonSchema $schema) {
        return [
          'intent' => $schema->string()->enum(['tour_detail', 'tour_query', 'my_bookings', 'booking_detail', 'general'])->required(),
          'args' => $schema->object([
            'tour_id' => $schema->integer()->required(),
            'continents' => $schema->array()->items($schema->string()->required())->required(),
            'countries' => $schema->array()->items($schema->string()->required())->required(),
            'duration_days' => $schema->array()->items($schema->integer()->required())->required(),
            'duration_min' => $schema->integer()->required(),
            'duration_max' => $schema->integer()->required(),
            'price_min' => $schema->number()->required(),
            'price_max' => $schema->number()->required(),
          ])->required()->withoutAdditionalProperties(),
        ];
      },
    )->prompt(
      prompt: $prompt,
      provider: $this->chatbotModelProvider,
      model: $this->chatbotModelName,
    );
    $this->trackTokenUsage($response);
    $context = match ($response['intent'] ?? 'general') {
      'tour_detail' => $this->retrieveTourDetailContext($response['args'] ?? []),
      'tour_query' => $this->retrieveTourQueryContext($response['args'] ?? []),
      'my_bookings' => $this->retrieveMyBookingsContext($response['args'] ?? []),
      'booking_detail' => $this->retrieveBookingDetailContext($response['args'] ?? []),
      default => "No context available.",
    };

    return [
      'intent' => $response['intent'] ?? 'general',
      'args' => $response['args'] ?? [],
      'context' => $context,
    ];
  }

  private function retrieveTourQueryContext(array $args)
  {
    $tours = Tour::query()
      ->where('company_id', $this->company->id)
      ->when(!empty($args['continents'] ?? []), fn($q) => $q->whereIn('continent_name', $args['continents']))
      ->when(!empty($args['countries'] ?? []), fn($q) => $q->whereIn('country_name', $args['countries']))
      ->when(($args['duration_min'] ?? 0) > 0, fn($q) => $q->where('duration_days', '>=', $args['duration_min']))
      ->when(($args['duration_max'] ?? 0) > 0, fn($q) => $q->where('duration_days', '<=', $args['duration_max']))
      ->when(($args['price_min'] ?? 0) > 0, fn($q) => $q->where('showprice', '>=', $args['price_min']))
      ->when(($args['price_max'] ?? 0) > 0, fn($q) => $q->where('showprice', '<=', $args['price_max']))
      ->limit(5)
      ->get();

    $rows = $tours->map(function ($tour) {
      return "| {$tour->id} | {$tour->code} | {$tour->name} | {$tour->duration_days} | {$tour->destination} | {$tour->country_name} | {$tour->showprice} |";
    })->implode("\n");
    return <<<CONTEXT
      Based on the search criteria, here are some relevant tours from the system:
      | id | code | name | duration_days | destination | country_name | price |
      |----|------|------|---------------|-------------|--------------|-------|
      {$rows}
      CONTEXT;
  }

  private function retrieveTourDetailContext(array $args)
  {
    $tourId = $args['tour_id'] ?? null;
    $tour = Tour::find($tourId);
    if (!$tour) {
      return null;
    }

    $embedded = Embeddings::for([$this->message->message])
      ->cache()
      ->generate(
        provider: $this->embeddingModelProvider,
        model: $this->embeddingModelName,
      );
    $this->trackTokenUsage($embedded);
    // Retrieve relevant documents based on the tour and user's question
    $documents = TourDocumentKnowledgeBase::query()
      ->whereVectorSimilarTo('embedding', $embedded->embeddings[0] ?? null, minSimilarity: 0.1)
      ->where('tour_id', $tour->id)
      ->limit(3)
      ->pluck('content');

    $documentRows =  $documents
      ? $documents->map(function ($doc) {
        return "- {$doc}";
      })->implode("\n")
      : '';
    $relevantKnowledges = $documentRows ? "Relevant information about the tour has been retrieved from the system:\n{$documentRows}" : "";

    return <<<CONTEXT
      Tour details retrieved from system:
      | id | code | name | duration_days | destination | country_name | price |
      |----|------|------|---------------|-------------|--------------|-------|
      | {$tour->id} | {$tour->code} | {$tour->name} | {$tour->duration_days} | {$tour->destination} | {$tour->country_name} | {$tour->showprice} |
      
      {$relevantKnowledges}
      CONTEXT;
  }

  private function retrieveMyBookingsContext(array $args)
  {
    $bookings = Booking::query()
      ->where('user_id', $this->message->sender_id)
      ->where('agent_id', $this->company->id)
      ->orderBy('created_at', 'desc')
      ->limit(3)
      ->get();
    if ($bookings->isEmpty()) {
      return "No recent bookings found in the system.";
    }
    $rows = $bookings->map(function ($booking) {
      return "| {$booking->id} | {$booking->booking_number} | {$booking->tour->name} | {$booking->departure_date} | {$booking->status} | {$booking->total_price} |";
    })->implode("\n");
    return <<<CONTEXT
      Here are your recent bookings:
      | id | booking_number | tour_name | departure_date | status | total_price |
      |----|----------------|-----------|----------------|--------|-------------|
      {$rows}
      CONTEXT;
  }

  private function retrieveBookingDetailContext(array $args)
  {
    if ($this->message->sender_type !== User::class) {
      return "No booking information available.";
    }
    $bookingId = $args['booking_id'] ?? null;
    $booking = Booking::with(['tour'])->find($bookingId);
    if ($booking->user_id !== $this->message->sender_id || $booking->agent_id !== $this->company->id) {
      return "No booking information available.";
    }
    if (!$booking) {
      return "No booking information available.";
    }
    return <<<CONTEXT
      Booking details retrieved from system:
      | id | booking_number | tour_name | departure_date | status | total_price | pax_adult | pax_child | pax_infant | contact_name | contact_email |
      |----|----------------|-----------|----------------|--------|-------------|-----------|-----------|-----------|--------------|----------------|
      | {$booking->id} | {$booking->booking_number} | {$booking->tour->name} | {$booking->departure_date} | {$booking->status} | {$booking->total_price} | {$booking->pax_adult} | {$booking->pax_child} | {$booking->pax_infant} | {$booking->contact_name} | {$booking->contact_email} |
      CONTEXT;
  }

  private function saveBotMessage(string $message, array $additionalData = []): void
  {
    // Create a new chat message for the bot's response
    ChatMessage::create(array_merge([
      'room_id' => $this->message->room_id,
      'sender_type' => 'company',
      'sender_id' => $this->company->id,
      'message' => $message,
      'is_bot' => true,
    ], $additionalData));
  }

  private function saveUsageLog(): void
  {
    $usageCost = $this->getUsageCost();
    $userCost = $this->userCostPerInteraction;
    DB::transaction(function () use ($userCost, $usageCost) {
      AiCredit::where('id', $this->credit->id)->decrement('balance', $userCost);

      AiUsageLog::create([
        'company_id' => $this->company->id,
        'embedding_tokens' => $this->embeddingTokens,
        'prompt_tokens' => $this->promptTokens,
        'completion_tokens' => $this->completionTokens,
        'usage_cost' => $usageCost,
        'user_cost' => $userCost,
        'feature' => 'chatbot',
      ]);
    });
  }

  private function trackTokenUsage(EmbeddingsResponse | AgentResponse $response)
  {
    if ($response instanceof EmbeddingsResponse) {
      $this->embeddingTokens += $response->tokens ?? 0;
    } else {
      $this->promptTokens += $response->usage->promptTokens ?? 0;
      $this->completionTokens += $response->usage->completionTokens ?? 0;
    }
  }

  private function setup()
  {
    $config = AppConfig::where('key', 'chatbot')->first()?->value;
    if (!$config) {
      $this->shouldRespond = false;
      return;
    }
    $this->chatbotModelProvider = $config['chatbot_model_provider'] ?? '';
    $this->chatbotModelName = $config['chatbot_model_name'] ?? '';
    $this->embeddingModelProvider = $config['embedding_model_provider'] ?? '';
    $this->embeddingModelName = $config['embedding_model_name'] ?? '';
    $this->promptTokenCostPerMillion = $config['prompt_token_cost_per_million'] ?? '0';
    $this->completionTokenCostPerMillion = $config['completion_token_cost_per_million'] ?? '0';
    $this->embeddingTokenCostPerMillion = $config['embedding_token_cost_per_million'] ?? '0';
    $this->userCostPerInteraction = $config['user_cost_per_interaction'] ?? '0';

    // Exit if the message is from a bot or not in a private room
    if ($this->message->is_bot || $this->message->room->type !== 'private') {
      $this->shouldRespond = false;
      return;
    }

    // Get message sender information
    $sender = $this->message->room->members()
      ->where('member_id', $this->message->sender_id)
      ->where('member_type', $this->message->sender_type)
      ->first();

    // Return the first member that is not the sender
    $this->receiver = $this->message->room->members()
      ->where('id', '!=', $sender?->id)
      ->first();
    $this->company = $this->receiver?->member_type === 'company' ? $this->receiver->member : null;

    if (!$this->company) {
      $this->shouldRespond = false;
      return;
    }

    $this->credit = $this->company->aiCredit()->first();
    if (!$this->credit) {
      $this->shouldRespond = false;
      return;
    }

    // If balance is zero or negative, do not respond and exit early
    if (bccomp((string) $this->credit->balance, '0', 10) <= 0) {
      $this->shouldRespond = false;
      return;
    }

    $this->settings = $this->company->settings;

    if (!$this->settings?->chatbot_enabled) {
      $this->shouldRespond = false;
      return;
    }

    // Retrieve the last 10 messages in reverse order
    $this->chatMessages = $this->message->room->messages()
      ->latest()
      ->take(10)
      ->get()
      ->reverse();
    $this->shouldRespond = true;
  }
}
