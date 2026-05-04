<?php

namespace App\Listeners;

use App\Ai\Agents\ChatbotAgent;
use App\Events\ChatMessageCreated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class ChatbotAutoReply implements ShouldQueue
{
  use InteractsWithQueue;

  /**
   * Create the event listener.
   */
  public function __construct()
  {
    // Dependency injection of ChatbotService
  }

  /**
   * Handle the event.
   * Processes a new chat message and triggers chatbot reply if conditions are met.
   */
  public function handle(ChatMessageCreated $event): void
  {
    try {
      $agent = ChatbotAgent::make($event->message);
      $agent->reply();
    } catch (\Throwable $e) {
      Log::error('ChatbotAutoReply Error: ' . $e->getMessage());
    }
  }
}
