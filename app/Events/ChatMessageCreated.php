<?php

namespace App\Events;

use App\Http\Resources\ChatMessageResource;
use App\Models\ChatMessage;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ChatMessageCreated  implements ShouldBroadcast
{
  use Dispatchable, InteractsWithSockets, SerializesModels;

  /**
   * Create a new event instance.
   * 
   * @param ChatMessage $chat The chat message that was created
   */
  public function __construct(public ChatMessage $chat)
  {
    Log::info("ChatMessageCreated event instantiated for chat message ID: {$chat->id}");
    // The chat message is passed to the event for broadcasting
  }

  /**
   * Get the channels the event should broadcast on.
   * Broadcasts to both room channel (for chat updates) and user channels (for notifications).
   *
   * @return array<int, \Illuminate\Broadcasting\PrivateChannel>
   */
  public function broadcastOn(): array
  {
    $channels = [];

    // 1️⃣ Room channel - for updating chat detail view
    $channels[] = new PrivateChannel("rooms.{$this->chat->room_id}");

    // 2️⃣ User channels - for updating chat list sidebar for each member
    $this->chat->load('room.members');
    foreach ($this->chat->room->members as $member) {
      if ($member->member_type === 'user') {
        Log::debug("Adding channel for member", ['member_id' => $member->id, 'member_type' => $member->member_type]);
        $channels[] = new PrivateChannel("users.{$member->member_id}");
      } else if ($member->member_type === 'company') {
        /** @var \App\Models\Company $company */
        $company = $member->member;
        $company->load('members'); // Eager load members to avoid N+1 queries

        Log::debug("Adding channels for company member", ['company' => $company]);
        $companyMembers = $company->members; // Assuming a company has many users
        foreach ($companyMembers as $cm) {
          $channels[] = new PrivateChannel("users.{$cm->id}");
        }
      }
    }

    return $channels;
  }

  /**
   * The event name to broadcast as.
   * 
   * @return string
   */
  public function broadcastAs(): string
  {
    return 'ChatMessageCreated';
  }

  /**
   * Get the data to broadcast.
   * Serializes the chat message with its relationships.
   * 
   * @return array
   */
  public function broadcastWith(): array
  {
    // Eager load relationships to avoid N+1 queries
    $this->chat->loadMissing(['sender', 'room']);

    // Use resource to control serialized data structure
    $resource = new ChatMessageResource($this->chat);

    return $resource->resolve();
  }
}
