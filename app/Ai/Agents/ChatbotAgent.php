<?php

namespace App\Ai\Agents;

use App\Models\ChatMessage;
use App\Models\Tour;
use App\Models\TourDocumentKnowledgeBase;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Embeddings;
use Laravel\Ai\Messages\Message;
use Laravel\Ai\Messages\MessageRole;
use Laravel\Ai\Promptable;
use Laravel\Ai\Responses\AgentResponse;
use Stringable;

class ChatbotAgent implements Agent, Conversational, HasTools
{
  use Promptable;

  public function __construct(
    protected ChatMessage $message
  ) {}

  /**
   * Get the instructions that the agent should follow.
   */
  public function instructions(): Stringable|string
  {
    return 'You are an AI chatbot assisting users in a private chat.
Rules:
- If you are unsure, say you are unsure and ask for clarification.
- Keep answers short, clear, and friendly.
- Do not mention embeddings, vectors, or internal systems.
- Include tour code if available when discussing a tour to make follow-up easier.
- If the user asks about a tour but no code is provided, ask for the tour code or details to identify the tour.';
  }

  /**
   * Get the list of messages comprising the conversation so far.
   */
  public function messages(): iterable
  {
    $rawMessages = $this->message->room->messages()->latest()->take(10)->get()->reverse();
    return Arr::map($rawMessages->toArray(), fn($rawMessage) => new Message(
      $rawMessage['is_bot'] ? MessageRole::Assistant : MessageRole::User,
      $rawMessage['message'],
    ));
  }

  /**
   * Get the tools available to the agent.
   *
   * @return Tool[]
   */
  public function tools(): iterable
  {
    return [];
  }

  public function reply(): void
  {
    // Skip if message is from a bot
    if ($this->message->is_bot) {
      return;
    }

    // Only process private room messages
    if ($this->message->room->type !== 'private') {
      return;
    }

    $receiver = $this->getReceiver();
    // if (! $receiver || ! $this->chatbotEnabled($receiver)) {
    //   return;
    // }

    $detected = $this->detectIntent();

    match ($detected['intent']) {
      'search' => $this->handleSearchIntent($detected, $receiver),
      'detail' => $this->handleDetailIntent($detected, $receiver),
      'general' => $this->handleGeneralIntent($receiver),
      default => null,
    };
  }

  private function getReceiver(): ?object
  {
    $sender = $this->message->room->members()
      ->where('member_id', $this->message->sender_id)
      ->where('member_type', $this->message->sender_type)
      ->first();

    return $this->message->room->members()
      ->where('id', '!=', $sender->id)
      ->first();
  }

  private function chatbotEnabled(?object $receiver): bool
  {
    return $receiver?->member_type === 'company'
      && $receiver->member->settings?->use_chatbot === true;
  }

  private function detectIntent(): AgentResponse
  {
    $intentDetector = new ChatbotIntentDetectorAgent($this->message);
    $detected = $intentDetector->prompt("Detect intent and extract filters from the user's message. Only return structured JSON.");
    Log::info("Chatbot intent detection result", ['result' => $detected]);

    return $detected;
  }

  private function handleSearchIntent(AgentResponse $detected, object $receiver): void
  {
    $query = Tour::query()
      ->where('company_id', $receiver->member_id)
      ->when(!empty($detected['search']['continents'] ?? []), fn($q) => $q->whereIn('continent_name', $detected['search']['continents']))
      ->when(!empty($detected['search']['countries'] ?? []), fn($q) => $q->whereIn('country_name', $detected['search']['countries']))
      ->when(!empty($detected['search']['duration_days'] ?? []), fn($q) => $q->whereIn('duration_days', $detected['search']['duration_days']))
      ->when(($detected['search']['duration_min'] ?? 0) !== 0, fn($q) => $q->where('duration_days', '>=', $detected['search']['duration_min']))
      ->when(($detected['search']['duration_max'] ?? 0) !== 0, fn($q) => $q->where('duration_days', '<=', $detected['search']['duration_max']))
      ->when(($detected['search']['price_min'] ?? 0) !== 0, fn($q) => $q->where('showprice', '>=', $detected['search']['price_min']))
      ->when(($detected['search']['price_max'] ?? 0) !== 0, fn($q) => $q->where('showprice', '<=', $detected['search']['price_max']))
      ->limit(5)
      ->get();
    $response = $this->prompt("Respond to the user's search query for tours based on the following filters: " . json_encode($detected['search']) . ". Here are some matching tours:\n" . $query->map(fn($tour) => "- {$tour->name} in {$tour->country_name} ({$tour->duration_days} days)\n  Destination: {$tour->destination}\n  Region: {$tour->region_name}\n  Continent: {$tour->continent_name}\n  Price: \${$tour->showprice}")->implode("\n") . "\nIf no tours match, say 'No tours found matching your criteria.'");
    $this->saveBotMessage($response->text, $receiver);
  }

  private function handleDetailIntent(AgentResponse $detected, object $receiver): void
  {
    $tourCode = $detected['detail']['tour_code'] ?? null;
    $contextOfDetail = '';
    $tour = Tour::query()
      ->where('code', $tourCode)
      ->first();
    if ($tour === null) {
      $contextOfDetail = "The user asked about a tour with code '{$tourCode}', but it was not found in the database.";
    } else {
      $contextOfDetail = "The user asked about the tour '{$tour->name}' (code: {$tour->code}). It is a {$tour->duration_days}-day tour in {$tour->country_name}, {$tour->region_name}, {$tour->continent_name}. The destination is {$tour->destination} and the price is \${$tour->showprice}.";
      $embedded = Embeddings::for([$this->message->message])
        ->cache()
        ->generate();

      $relevantDocuments = TourDocumentKnowledgeBase::query()
        ->whereVectorSimilarTo('embedding', $embedded->embeddings[0] ?? null, minSimilarity: 0.1)
        ->where('tour')
        ->limit(3)
        ->get();

      Log::info("ChatbotAgent relevant documents", ['documents' => $relevantDocuments]);

      $response = $this->prompt(
        "You are a helpful assistant in a chat application. Respond to the user's message in a friendly and concise manner. If the user asks a question, provide a clear answer. If the user shares information, acknowledge it and offer assistance if needed. Always maintain a positive and supportive tone."
          . "\n\nContext of the user's query:\n" . $contextOfDetail . "\n\nRelevant tour document from database:\n" . $relevantDocuments->pluck('content')->implode("\n\n---\n")
      );
    }

    $this->saveBotMessage($response->text, $receiver);
  }

  private function handleGeneralIntent(object $receiver): void
  {
    $response = $this->prompt("Respond to the user's general travel question in a friendly and informative way. If you don't know the answer, say you don't know but offer to help with other questions.");

    $this->saveBotMessage($response->text, $receiver);
  }

  private function saveBotMessage(string $message, object $receiver): void
  {
    ChatMessage::create([
      'room_id' => $this->message->room_id,
      'sender_type' => $receiver->member_type,
      'sender_id' => $receiver->member_id,
      'user_id' => null,
      'message' => $message,
      'is_bot' => true,
    ]);
  }
}
