<?php

namespace App\Ai\Agents;

use App\Models\ChatMessage;
use App\Models\Company;
use App\Models\Tour;
use App\Models\TourDocumentKnowledgeBase;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Embeddings;
use Laravel\Ai\Messages\Message;
use Laravel\Ai\Messages\MessageRole;
use Laravel\Ai\Promptable;
use Laravel\Ai\Responses\AgentResponse;
use Stringable;

class ChatbotAgent implements Agent, Conversational
{
  use Promptable;

  public function __construct(private ChatMessage $message) {}

  public function instructions(): Stringable|string
  {
    $company = $this->getCompany();
    $settings = $company?->settings;

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
    // Retrieve the last 10 messages in reverse order
    $rawMessages = $this->message->room->messages()
      ->latest()
      ->take(10)
      ->get()
      ->reverse();

    return Arr::map($rawMessages->toArray(), function ($rawMessage) {
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

  public function reply(): void
  {
    // Exit if the message is from a bot or not in a private room
    if ($this->message->is_bot || $this->message->room->type !== 'private') {
      return;
    }

    $receiver = $this->getReceiver();
    if (!$receiver) {
      return;
    }
    if (!$receiver->member->settings?->chatbot_enabled) {
      return;
    }

    // Detect the intent of the message
    $detected = $this->detectIntent();

    // Handle the detected intent accordingly
    match ($detected['intent'] ?? 'general') {
      'search' => $this->handleSearchIntent($detected, $receiver),
      'detail' => $this->handleDetailIntent($detected, $receiver),
      'general' => $this->handleGeneralIntent($receiver),
      default => null,
    };
  }

  private function getCompany(): ?Company
  {
    $receiver = $this->getReceiver();
    return $receiver?->member_type === 'company' ? $receiver->member : null;
  }

  private function getReceiver(): ?object
  {
    // Get the sender of the message
    $sender = $this->message->room->members()
      ->where('member_id', $this->message->sender_id)
      ->where('member_type', $this->message->sender_type)
      ->first();

    // Return the first member that is not the sender
    return $this->message->room->members()
      ->where('id', '!=', $sender?->id)
      ->first();
  }

  private function detectIntent(): AgentResponse
  {
    $detector = new ChatbotIntentDetectorAgent($this->message);
    $detected = $detector->prompt(
      'Detect intent and extract filters from the user message. '
        . 'Return only structured JSON.'
    );
    Log::info('Chatbot intent detection', ['result' => $detected]);

    return $detected;
  }

  private function handleSearchIntent(AgentResponse $detected, object $receiver): void
  {
    $filters = $detected['search'] ?? [];
    $tours = Tour::query()
      ->where('company_id', $receiver->member_id)
      ->when(!empty($filters['continents'] ?? []), fn($q) => $q->whereIn('continent_name', $filters['continents']))
      ->when(!empty($filters['countries'] ?? []), fn($q) => $q->whereIn('country_name', $filters['countries']))
      ->when(($filters['duration_min'] ?? 0) > 0, fn($q) => $q->where('duration_days', '>=', $filters['duration_min']))
      ->when(($filters['duration_max'] ?? 0) > 0, fn($q) => $q->where('duration_days', '<=', $filters['duration_max']))
      ->when(($filters['price_min'] ?? 0) > 0, fn($q) => $q->where('showprice', '>=', $filters['price_min']))
      ->when(($filters['price_max'] ?? 0) > 0, fn($q) => $q->where('showprice', '<=', $filters['price_max']))
      ->limit(5)
      ->get();

    // Format the list of matching tours
    $tourList = $tours->map(fn($t) => "- ID{$t->id}\nName: {$t->name}\nDuration: {$t->duration_days} days\nDestination: {$t->destination}\nCountry: {$t->country_name}\nPrice: \${$t->showprice}")->implode("\n");

    $prompt = "Respond to the user's tour search based on filters: "
      . json_encode($filters) . ".\n\nMatching tours:\n{$tourList}\n\n"
      . ($tours->isEmpty() ? "No tours found matching the criteria." : "");

    $response = $this->prompt($prompt);

    // Save the bot's response
    $this->saveBotMessage($response->text, $receiver, [
      'attachment_type' => 'bot-hints',
      'attachment_data' => "Tour ID reference:\n" . $tours->map(fn($t) => "ID{$t->id} → {$t->name}")->implode("\n"),
    ]);
  }

  private function handleDetailIntent(AgentResponse $detected, object $receiver): void
  {
    $tourId = $detected['detail']['tour_id'] ?? null;
    $tour = Tour::find($tourId);

    // If the tour is not found, respond accordingly
    if (!$tour) {
      $response = $this->prompt(
        "The user asked about tour ID '{$tourId}' which was not found. "
          . "Politely explain this and ask for clarification."
      );
      $this->saveBotMessage($response->text, $receiver);
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

    $response = $this->prompt($prompt);
    $this->saveBotMessage($response->text, $receiver, [
      'attachment_type' => 'tour',
      'attachment_data' => (string) $tour->id,
    ]);
  }

  private function handleGeneralIntent(object $receiver): void
  {
    $response = $this->prompt(
      "Respond to the user's general travel question in a helpful way. "
        . "If unsure, offer to help differently."
    );
    $this->saveBotMessage($response->text, $receiver);
  }

  private function saveBotMessage(string $message, object $receiver, array $additionalData = []): void
  {
    // Create a new chat message for the bot's response
    ChatMessage::create(array_merge([
      'room_id' => $this->message->room_id,
      'sender_type' => $receiver->member_type,
      'sender_id' => $receiver->member_id,
      'message' => $message,
      'is_bot' => true,
    ], $additionalData));
  }
}
