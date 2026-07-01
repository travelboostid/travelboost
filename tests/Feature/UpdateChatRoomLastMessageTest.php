<?php

use App\Events\ChatMessageCreated;
use App\Listeners\UpdateChatRoomLastMessage;
use App\Models\ChatMessage;
use App\Models\ChatRoom;
use App\Models\ChatRoomMember;
use App\Models\Company;
use App\Models\User;

test('streaming bot placeholder does not update room last message', function () {
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

    $userMessage = ChatMessage::withoutEvents(fn (): ChatMessage => ChatMessage::query()->create([
        'room_id' => $room->id,
        'sender_type' => 'user',
        'sender_id' => $user->id,
        'user_id' => $user->id,
        'message' => 'Hello',
        'is_bot' => false,
    ]));

    $room->update(['last_message_id' => $userMessage->id]);

    $placeholder = ChatMessage::query()->create([
        'room_id' => $room->id,
        'sender_type' => 'company',
        'sender_id' => $company->id,
        'message' => '',
        'is_bot' => true,
        'meta' => ['streaming' => true],
    ]);

    (new UpdateChatRoomLastMessage)->handle(new ChatMessageCreated($placeholder));

    expect($room->fresh()->last_message_id)->toBe($userMessage->id);
});

test('non streaming bot message updates room last message', function () {
    $company = Company::factory()->create();

    $room = ChatRoom::query()->create([
        'type' => 'private',
        'name' => null,
    ]);

    $botMessage = ChatMessage::query()->create([
        'room_id' => $room->id,
        'sender_type' => 'company',
        'sender_id' => $company->id,
        'message' => 'Final reply',
        'is_bot' => true,
        'meta' => ['streaming' => false],
    ]);

    (new UpdateChatRoomLastMessage)->handle(new ChatMessageCreated($botMessage));

    expect($room->fresh()->last_message_id)->toBe($botMessage->id);
});
