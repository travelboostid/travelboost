<?php

namespace App\Ai\Agents;

use App\Models\AiBillingCycle;
use App\Models\AiCredit;
use App\Models\AiModel;
use App\Models\AiUsageLog;
use App\Models\ChatMessage;
use App\Models\ChatRoomMember;
use App\Models\Company;
use App\Models\CompanySettings;
use App\Models\Tour;
use App\Models\TourDocumentKnowledgeBase;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Embeddings;
use Laravel\Ai\Messages\Message;
use Laravel\Ai\Messages\MessageRole;
use Laravel\Ai\Promptable;
use Laravel\Ai\Responses\AgentResponse;
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
  private ?AiModel $chatbotModel = null; // Cached chatbot model
  private ?Collection $chatMessages = null; // Cache for raw chat messages
  private ?AiBillingCycle $currentBillingCycle = null; // Cache for current billing cycle
  private int $inputTokenUsage = 0;
  private int $outputTokenUsage = 0;
  private string $usageCost = '0.0';

  public function __construct(private ChatMessage $message)
  {
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

    $this->settings = $this->company->settings;

    if (!$this->settings?->chatbot_enabled) {
      $this->shouldRespond = false;
      return;
    }

    $this->chatbotModel = $this->settings->chatbotModel()->first();
    if (!$this->chatbotModel) {
      $this->shouldRespond = false;
      return;
    }

    // Retrieve the last 10 messages in reverse order
    $this->chatMessages = $this->message->room->messages()
      ->latest()
      ->take(10)
      ->get()
      ->reverse();

    $this->currentBillingCycle = AiBillingCycle::firstOrCreate([
      'company_id' => $this->company->id,
      'date' => now()->startOfDay(),
    ]);

    // Only run when NEW cycle created
    if ($this->currentBillingCycle->wasRecentlyCreated) {

      DB::transaction(function () {

        $previousCycles = AiBillingCycle::where('company_id', $this->company->id)
          ->whereNull('charged_at')
          ->where('id', '!=', $this->currentBillingCycle->id)
          ->lockForUpdate()
          ->get();

        $totalCost = '0';

        foreach ($previousCycles as $cycle) {
          $totalCost = bcadd($totalCost, $cycle->cost, 16);
        }

        // Deduct balance
        // Optional: prevent negative balance
        if (bccomp((string) $this->credit->balance, $totalCost, 16) < 0) {
          $this->credit->balance = '0';
        } else {
          $this->credit->balance = bcsub(
            (string) $this->credit->balance,
            $totalCost,
            10
          );
        }

        $this->credit->save();

        // Mark cycles as charged
        AiBillingCycle::whereIn('id', $previousCycles->pluck('id'))
          ->update(['charged_at' => now()]);
      });
    }

    // If balance is zero or negative, do not respond and exit early
    if (bccomp((string) $this->credit->balance, '0', 10) <= 0) {
      $this->shouldRespond = false;
      return;
    }

    $this->shouldRespond = true;
  }

  public function instructions(): Stringable|string
  {
    $settings = $this->company?->settings;

    $baseInstructions = 'You are an AI travel assistant in a private chat. Keep answers short, clear, and helpful.';

    // Define tone options
    $toneMap = [
      'professional' => 'Use formal, business-appropriate language.',
      'friendly' => 'Be warm and conversational.',
      'casual' => 'Use relaxed, informal language.',
      'enthusiastic' => 'Be upbeat and energetic.',
    ];

    // Define personality options
    $personalityMap = [
      'assistant' => 'Help users with information and questions.',
      'sales' => 'Focus on promoting tours and closing bookings.',
      'support' => 'Prioritize solving problems and addressing concerns.',
      'travel_consultant' => 'Provide expert travel advice and personalized recommendations.',
    ];

    // Determine emoji usage based on settings
    $emojiUsage = match ($settings?->chatbot_emoji_usage ?? 'minimal') {
      'none' => 'Do not use emojis.',
      'minimal' => 'Use emojis sparingly.',
      'moderate' => 'Use emojis occasionally to enhance messaging.',
      'expressive' => 'Use emojis liberally to express emotion.',
      default => 'Use emojis sparingly.',
    };

    return "{$baseInstructions}\n"
      . "Tone: " . ($toneMap[$settings?->chatbot_tone ?? 'professional'] ?? $toneMap['professional']) . "\n"
      . "Role: " . ($personalityMap[$settings?->chatbot_personality ?? 'assistant'] ?? $personalityMap['assistant']) . "\n"
      . "Emoji usage: {$emojiUsage}\n"
      . "If unsure, ask for clarification. Do not mention embeddings or internal systems.";
  }

  public function messages(): iterable
  {

    return Arr::map($this->chatMessages->toArray(), function ($rawMessage) {
      $msg = $rawMessage['message'];

      // If the message has an attachment of type 'tour', add tour details
      if ($rawMessage['attachment_type'] === 'tour') {
        $tourId = $rawMessage['attachment_data'];
        $tour = Tour::find($tourId);
        if ($tour) {
          $msg .= "\n\n---\n\n Additional context:\n"
            . "This message related with tour details below: \n"
            . "Tour ID: {$tour->id}\n"
            . "Tour name: {$tour->name}\n"
            . "Tour code: ({$tour->code})\n"
            . "Duration: {$tour->duration_days} days\n"
            . "Destination: {$tour->destination}\n"
            . "Country: {$tour->country_name}";
        }
      } elseif ($rawMessage['attachment_type'] === 'bot-hints') {
        $msg .= "\n\n---\n\n Additional context:\n"
          . "Hints for understanding the bot's response: \n"
          . $rawMessage['attachment_data'];
      }

      return new Message(
        $rawMessage['is_bot'] ? MessageRole::Assistant : MessageRole::User,
        $msg,
      );
    });
  }

  public function reply()
  {
    if (!$this->shouldRespond) {
      return;
    }
    // Detect the intent of the message
    $detected = $this->detectIntent();

    // Handle the detected intent accordingly
    match ($detected['intent'] ?? 'general') {
      'search' => $this->handleSearchIntent($detected),
      'detail' => $this->handleDetailIntent($detected),
      'general' => $this->handleGeneralIntent($detected),
      default => null,
    };

    // Save the AI usage log for billing and analytics
    $this->saveUsageLog();
  }

  private function detectIntent(): AgentResponse
  {
    $response = agent(
      instructions: <<<'PROMPT'
  Analyze the user message and:

  1. Detect intent:
     - detail → asking about a specific tour or following up on a tour.
     Tour code may be provided in the message or inferred from recent chat context.
     Never go to detail intent if you cannot find a tour code in the message or recent chat context.
     Ask for clarification if you cannot find a tour code.
     - search → looking for tours based on criteria
     - general → general travel questions or chit-chat

  2. Extract structured arguments if available.
  PROMPT,
      messages: $this->messages(),
      tools: [],
      schema: function (JsonSchema $schema) {
        return [
          'intent' => $schema->string()->enum(['detail', 'search', 'general'])->required(),
          'search' => $schema->object([
            'continents' => $schema->array()->items($schema->string()->required())->required(),
            'countries' => $schema->array()->items($schema->string()->required())->required(),
            'duration_days' => $schema->array()->items($schema->integer()->required())->required(),
            'duration_min' => $schema->integer()->required(),
            'duration_max' => $schema->integer()->required(),
            'price_min' => $schema->number()->required(),
            'price_max' => $schema->number()->required(),
          ])->required()->withoutAdditionalProperties(),
          'detail' => $schema->object([
            'tour_id' => $schema->number()->required(),
          ])->required()->withoutAdditionalProperties(),
        ];
      },
    )->prompt(
      prompt: 'Detect intent and extract filters from the user message. Return only structured JSON.',
      model: $this->chatbotModel->code
    );

    $this->trackTokenUsage($response);

    return $response;
  }

  private function handleSearchIntent(AgentResponse $detected): void
  {
    $filters = $detected['search'] ?? [];
    $tours = Tour::query()
      ->where('company_id', $this->company->id)
      ->when(!empty($filters['continents'] ?? []), fn($q) => $q->whereIn('continent_name', $filters['continents']))
      ->when(!empty($filters['countries'] ?? []), fn($q) => $q->whereIn('country_name', $filters['countries']))
      ->when(($filters['duration_min'] ?? 0) > 0, fn($q) => $q->where('duration_days', '>=', $filters['duration_min']))
      ->when(($filters['duration_max'] ?? 0) > 0, fn($q) => $q->where('duration_days', '<=', $filters['duration_max']))
      ->when(($filters['price_min'] ?? 0) > 0, fn($q) => $q->where('showprice', '>=', $filters['price_min']))
      ->when(($filters['price_max'] ?? 0) > 0, fn($q) => $q->where('showprice', '<=', $filters['price_max']))
      ->limit(5)
      ->get();

    // Format the list of matching tours
    $tourList = $tours->map(fn($t) => "- {$t->name} | Duration: {$t->duration_days} days | Destination: {$t->destination} | Country: {$t->country_name} | Price: \${$t->showprice}")->implode("\n");

    $prompt = "Respond to the user's tour search based on filters: "
      . json_encode($filters) . ".\n\nMatching tours:\n{$tourList}\n\n"
      . ($tours->isEmpty() ? "No tours found matching the criteria." : "");

    $response = $this->prompt(prompt: $prompt, model: $this->chatbotModel->code);

    $this->trackTokenUsage($response);

    // Save the bot's response
    $this->saveBotMessage($response->text, [
      'attachment_type' => 'bot-hints',
      'attachment_data' => "Tour ID reference:\n" . $tours->map(fn($t) => "ID{$t->id} → {$t->name}")->implode("\n"),
    ]);
  }

  private function handleDetailIntent(AgentResponse $detected): void
  {
    $tourId = $detected['detail']['tour_id'] ?? null;
    $tour = Tour::find($tourId);

    // If the tour is not found, respond accordingly
    if (!$tour) {
      $response = $this->prompt(
        prompt: "The user asked about tour ID '{$tourId}' which was not found. Politely explain this and ask for clarification.",
        model: $this->chatbotModel->code
      );

      $this->trackTokenUsage($response);

      $this->saveBotMessage($response->text);
      return;
    }

    // Prepare context information about the tour
    $contextFromEntity = "Tour: {$tour->name}\n"
      . "Code: {$tour->code}\n"
      . "Duration: {$tour->duration_days} days\n"
      . "Destination: {$tour->destination}\n"
      . "Country: {$tour->country_name}\n"
      . "Price: \${$tour->showprice}";

    $prompt = "Context from entity: {$contextFromEntity}\n\n";

    // Generate embeddings for the user's message
    $embedded = Embeddings::for([$this->message->message])
      ->cache()
      ->generate();

    // Retrieve relevant documents based on the tour and user's question
    $documents = TourDocumentKnowledgeBase::query()
      ->whereVectorSimilarTo('embedding', $embedded->embeddings[0] ?? null, minSimilarity: 0.1)
      ->where('tour_id', $tour->id)
      ->limit(3)
      ->pluck('content')
      ->implode("\n\n---\n");

    // Append retrieved documents to the prompt if available
    if ($documents) {
      $prompt .= "Retrieved relevant tour documents from system based on the user's question:\n{$documents}\n\n";
    }
    $prompt .= "Answer the user's question about the tour using the above information. If the question is not clear, ask for clarification.";

    $response = $this->prompt(prompt: $prompt, model: $this->chatbotModel->code);

    $this->trackTokenUsage($response);

    $this->saveBotMessage($response->text, [
      'attachment_type' => 'tour',
      'attachment_data' => (string) $tour->id,
    ]);
  }

  private function handleGeneralIntent(AgentResponse $detected): void
  {
    $response = $this->prompt(
      prompt: "Respond to the user's general travel question in a helpful way. If unsure, offer to help differently.",
      model: $this->chatbotModel->code
    );

    $this->trackTokenUsage($response);

    $this->saveBotMessage($response->text);
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
    $inputRate = (string) $this->chatbotModel->input_token_rate;
    $outputRate = (string) $this->chatbotModel->output_token_rate;

    $inputTokens = (string) $this->inputTokenUsage;
    $outputTokens = (string) $this->outputTokenUsage;

    $inputInMillions = bcdiv($inputTokens, '1000000', 16);
    $outputInMillions = bcdiv($outputTokens, '1000000', 16);

    $inputCost = bcmul($inputInMillions, $inputRate, 16);
    $outputCost = bcmul($outputInMillions, $outputRate, 16);

    // total
    $totalCost = bcadd($inputCost, $outputCost, 16);
    $this->usageCost = bcadd($this->usageCost, $totalCost, 16);

    // TODO: use transaction
    AiUsageLog::create([
      'company_id' => $this->company->id,
      'model_id' => $this->chatbotModel->id,
      'input_tokens' => $this->inputTokenUsage,
      'output_tokens' => $this->outputTokenUsage,
      'cost' => $this->usageCost,
      'feature' => 'chatbot',
      'billing_cycle_id' => $this->currentBillingCycle->id,
    ]);
    $this->currentBillingCycle->input_tokens += $this->inputTokenUsage;
    $this->currentBillingCycle->output_tokens += $this->outputTokenUsage;
    $this->currentBillingCycle->cost = bcadd(
      $this->currentBillingCycle->cost,
      $this->usageCost,
      16
    );
    $this->currentBillingCycle->save();
  }

  private function trackTokenUsage($response)
  {
    $this->inputTokenUsage += $response->usage->promptTokens ?? 0;
    $this->outputTokenUsage += $response->usage->completionTokens ?? 0;
  }
}
