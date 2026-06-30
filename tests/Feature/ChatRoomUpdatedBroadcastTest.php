<?php

use App\Events\ChatRoomUpdated;
use App\Http\Resources\ChatRoomResource;
use App\Models\ChatMessage;
use App\Models\ChatRoom;
use App\Models\ChatRoomMember;
use App\Models\Company;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;

test('chat room updated event broadcasts room with last message to member channels', function () {
    $company = Company::factory()->create();
    $user = User::factory()->create();

    $room = ChatRoom::query()->create([
        'type' => 'private',
        'name' => null,
    ]);

    ChatRoomMember::query()->create([
        'room_id' => $room->id,
        'member_type' => 'user',
        'member_id' => $user->id,
        'role' => 'member',
        'joined_at' => now(),
    ]);

    ChatRoomMember::query()->create([
        'room_id' => $room->id,
        'member_type' => 'company',
        'member_id' => $company->id,
        'role' => 'member',
        'joined_at' => now(),
    ]);

    $botMessage = ChatMessage::query()->create([
        'room_id' => $room->id,
        'sender_type' => 'company',
        'sender_id' => $company->id,
        'message' => 'Bot reply',
        'is_bot' => true,
        'meta' => ['streaming' => false],
    ]);

    $room->update(['last_message_id' => $botMessage->id]);

    $event = new ChatRoomUpdated($room->fresh(['lastMessage', 'members']));

    expect($event->broadcastAs())->toBe('ChatRoomUpdated')
        ->and($event->broadcastWith()['room']['id'])->toBe($room->id)
        ->and($event->broadcastWith()['room']['last_message']['id'])->toBe($botMessage->id)
        ->and($event->broadcastWith()['room']['last_message']['message'])->toBe('Bot reply')
        ->and($event->broadcastWith()['room']['last_message']['is_bot'])->toBeTrue();

    $channelNames = collect($event->broadcastOn())
        ->map(fn (Channel|PrivateChannel $channel): string => $channel->name)
        ->all();

    expect($channelNames)->toContain("private-users.{$user->id}")
        ->and($channelNames)->toContain("private-rooms.{$room->id}");

    expect((new ChatRoomResource($room->fresh(['lastMessage', 'members'])))->resolve())
        ->toHaveKey('last_message.message', 'Bot reply');
});
