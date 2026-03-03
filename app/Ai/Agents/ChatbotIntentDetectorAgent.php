<?php

namespace App\Ai\Agents;

use App\Models\ChatMessage;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Arr;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Messages\Message;
use Laravel\Ai\Messages\MessageRole;
use Laravel\Ai\Promptable;
use Stringable;

class ChatbotIntentDetectorAgent implements Agent, Conversational, HasStructuredOutput
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
    return "Analyze the user message and:

1. Detect intent:
   - detail → asking about a specific tour or following up on a tour
   - search → looking for tours based on criteria
   - general → general travel question

2. Extract structured arguments if available.
";
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

  public function schema(JsonSchema $schema): array
  {
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
        'tour_code' => $schema->string()->required(),
      ])->required()->withoutAdditionalProperties(),
    ];
  }
}
