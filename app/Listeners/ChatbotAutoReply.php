<?php

namespace App\Listeners;

use App\Ai\Agents\ChatbotAgent;
use App\Events\ChatMessageCreated;
use Illuminate\Support\Facades\Log;

class ChatbotAutoReply
{
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
    $agent = ChatbotAgent::make($event->message);
    $agent->reply();
  }
}
