<?php

namespace App\Listeners;

use App\Events\ChatMessageCreated;
use App\Models\ChatMessage;

class UpdateChatRoomLastMessage
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
     */
    public function handle(ChatMessageCreated $event): void
    {
        if ($this->shouldSkipUpdatingLastMessage($event->message)) {
            return;
        }

        $event->message->room()->update([
            'last_message_id' => $event->message->id,
        ]);
    }

    protected function shouldSkipUpdatingLastMessage(ChatMessage $message): bool
    {
        return $message->is_bot
            && ($message->meta['streaming'] ?? false)
            && $message->message === '';
    }
}
