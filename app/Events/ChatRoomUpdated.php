<?php

namespace App\Events;

use App\Events\Concerns\BroadcastsChatRoomToMembers;
use App\Http\Resources\ChatRoomResource;
use App\Models\ChatRoom;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatRoomUpdated implements ShouldBroadcastNow
{
    use BroadcastsChatRoomToMembers, Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public ChatRoom $room) {}

    /**
     * @return array<int, Channel|PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return $this->chatRoomChannels($this->room);
    }

    public function broadcastAs(): string
    {
        return 'ChatRoomUpdated';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        $this->room->loadMissing(['lastMessage', 'members']);

        return [
            'room' => (new ChatRoomResource($this->room))->resolve(),
        ];
    }
}
