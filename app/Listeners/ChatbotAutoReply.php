<?php

namespace App\Listeners;

use App\Ai\Agents\ChatbotAgent;
use App\Events\ChatMessageCreated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class ChatbotAutoReply implements ShouldQueue
{
  use Queueable;

  /**
   * Create the event listener.
   */
  public function __construct(
    public ChatMessageCreated $event
  ) {
    // Dependency injection of ChatbotService
  }

  /**
   * Handle the event.
   * Processes a new chat message and triggers chatbot reply if conditions are met.
   */
  public function handle(): void
  {
    $agent = ChatbotAgent::make($this->event->message);
    $agent->reply();
  }

  public function tries(): int
  {
    return 3;
  }

  public function backoff(): array
  {
    return [3, 5, 10];
  }

  public function failed(?Throwable $exception): void
  {
    Log::error('ChatbotAutoReply job failed', [
      'message_id' => $this->event->message->id,
      'error' => $exception ? $exception->getMessage() : 'Unknown error',
    ]);
  }
}
