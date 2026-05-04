<?php

namespace App\Listeners;

use App\Events\ChatMessageCreated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

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
    $event->message->room()->update([
      'last_message_id' => $event->message->id,
    ]);
  }
}
