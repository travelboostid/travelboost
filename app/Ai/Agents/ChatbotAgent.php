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

    $toneMap = [
      'professional' => 'Use formal, business-appropriate language.',
      'friendly' => 'Be warm and conversational.',
      'casual' => 'Use relaxed, informal language.',
      'enthusiastic' => 'Be upbeat and energetic.',
    ];

    $personalityMap = [
      'assistant' => 'Help users with information and questions.',
      'sales' => 'Focus on promoting tours and closing bookings.',
      'support' => 'Prioritize solving problems and addressing concerns.',
      'travel_consultant' => 'Provide expert travel advice and personalized recommendations.',
    ];

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
      . "Include tour codes when discussing specific tours.\n"
      . "If unsure, ask for clarification. Do not mention embeddings or internal systems.";
  }

  public function messages(): iterable
  {
    $rawMessages = $this->message->room->messages()
      ->latest()
      ->take(10)
      ->get()
      ->reverse();

    return Arr::map($rawMessages->toArray(), function ($rawMessage) {
      $msg = $rawMessage['message'];
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
      }

      return new Message(
        $rawMessage['is_bot'] ? MessageRole::Assistant : MessageRole::User,
        $msg,
      );
    });
  }

  public function reply(): void
  {
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

    $detected = $this->detectIntent();

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
    $sender = $this->message->room->members()
      ->where('member_id', $this->message->sender_id)
      ->where('member_type', $this->message->sender_type)
      ->first();

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

    $tourList = $tours->map(fn($t) => "- {$t->name} ({$t->code}): {$t->duration_days} days in {$t->country_name}, \${$t->showprice}")->implode("\n");

    $prompt = "Respond to the user's tour search based on filters: "
      . json_encode($filters) . ".\n\nMatching tours:\n{$tourList}\n\n"
      . ($tours->isEmpty() ? "No tours found matching the criteria." : "");

    $response = $this->prompt($prompt);

    $this->saveBotMessage($response->text, $receiver);
  }

  private function handleDetailIntent(AgentResponse $detected, object $receiver): void
  {
    $tourId = $detected['detail']['tour_id'] ?? null;
    $tour = Tour::find($tourId);

    if (!$tour) {
      $response = $this->prompt(
        "The user asked about tour ID '{$tourId}' which was not found. "
          . "Politely explain this and ask for clarification."
      );
      $this->saveBotMessage($response->text, $receiver);
      return;
    }

    $context = "Tour: {$tour->name} (Code: {$tour->code}), {$tour->duration_days} days, "
      . "{$tour->destination}, {$tour->country_name}, \${$tour->showprice}";

    $embedded = Embeddings::for([$this->message->message])
      ->cache()
      ->generate();

    $documents = TourDocumentKnowledgeBase::query()
      ->whereVectorSimilarTo('embedding', $embedded->embeddings[0] ?? null, minSimilarity: 0.1)
      ->where('tour_id', $tour->id)
      ->limit(3)
      ->pluck('content')
      ->implode("\n\n---\n");

    $prompt = "Context: {$context}\n\n"
      . "Relevant information:\n{$documents}\n\n"
      . "Respond helpfully to the user's question.";

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
    ChatMessage::create(array_merge([
      'room_id' => $this->message->room_id,
      'sender_type' => $receiver->member_type,
      'sender_id' => $receiver->member_id,
      'message' => $message,
      'is_bot' => true,
    ], $additionalData));
  }
}
