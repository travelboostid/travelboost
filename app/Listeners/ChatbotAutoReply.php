<?php

namespace App\Listeners;

use App\Ai\Agents\ChatbotAgent;
use App\Events\ChatMessageCreated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class ChatbotAutoReply implements ShouldQueue
{
    use Queueable;

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
        $agent = ChatbotAgent::make($event->message);

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

    public function failed(ChatMessageCreated $event, ?Throwable $exception): void
    {
        Log::error('ChatbotAutoReply job failed', [
            'message_id' => $event->message->id,
            'error' => $exception?->getMessage() ?? 'Unknown error',
        ]);
    }
}
