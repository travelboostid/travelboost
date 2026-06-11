<?php

namespace App\Listeners;

use App\Ai\Agents\ChatbotAgent;
use App\Events\ChatMessageCreated;
use Illuminate\Support\Facades\Log;
use Throwable;

class ChatbotAutoReply
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     * Processes a new chat message and triggers chatbot reply if conditions are met.
     */
    public function handle(ChatMessageCreated $event): void
    {
        try {
            retry(
                [3000, 5000],
                fn () => ChatbotAgent::make($event->message)->reply(),
            );
        } catch (Throwable $e) {
            Log::error('ChatbotAutoReply job failed', [
                'message_id' => $event->message->id,
                'error' => $e->getMessage(),
                'exception' => $e::class,
            ]);
        }
    }
}
