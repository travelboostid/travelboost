<?php

namespace App\Listeners;

use App\Events\ChatMessageCreated;
use App\Models\UserPreference;
use App\Services\ChatbotService;

class ChatbotReplyOnMessageCreated
{
  /**
   * Create the event listener.
   */
  public function __construct(private ChatbotService $chatbotService)
  {
    // Dependency injection of ChatbotService
  }

  /**
   * Handle the event.
   * Processes a new chat message and triggers chatbot reply if conditions are met.
   */
  public function handle(ChatMessageCreated $event): void
  {
    $chat = $event->chat;

    // Skip if message is from a bot
    if ($chat->is_bot) return;

    // Only process private room messages
    if ($chat->room->type !== 'private') return;

    // Find the recipient (member who is not the sender)
    $targetMember = $chat->room->members->first(fn($m) => $m->id !== $chat->sender_id);

    if (!$targetMember) return; // No recipient found

    // Check if recipient has chatbot enabled
    $preference = UserPreference::where('user_id', $targetMember->user_id)->first();

    if (!($preference?->use_chatbot)) return;

    // Trigger chatbot reply
    $this->chatbotService->answer($chat, $targetMember);
  }
}
