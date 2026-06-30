<?php

use App\Events\ChatMessageUpdated;
use App\Http\Resources\ChatMessageResource;
use App\Models\ChatMessage;
use App\Models\ChatRoom;
use App\Models\ChatRoomMember;
use App\Models\Company;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;

test('chat message updated event broadcasts to member channels with streaming flag', function () {
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

    $message = ChatMessage::query()->create([
        'room_id' => $room->id,
        'sender_type' => 'company',
        'sender_id' => $company->id,
        'message' => 'Partial reply',
        'is_bot' => true,
        'meta' => ['streaming' => true],
    ]);

    $event = new ChatMessageUpdated($message->fresh(['sender', 'room']));

    expect($event->broadcastAs())->toBe('ChatMessageUpdated')
        ->and($event->broadcastWith())->toMatchArray([
            'id' => $message->id,
            'message' => 'Partial reply',
            'is_streaming' => true,
        ]);

    $channelNames = collect($event->broadcastOn())
        ->map(fn (Channel|PrivateChannel $channel): string => $channel->name)
        ->all();

    expect($channelNames)->toContain("private-users.{$user->id}")
        ->and($channelNames)->toContain("private-rooms.{$room->id}");

    expect((new ChatMessageResource($message))->resolve())
        ->toHaveKey('is_streaming', true);
});
