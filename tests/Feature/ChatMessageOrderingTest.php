<?php

use App\Models\ChatMessage;
use App\Models\ChatRoom;
use App\Models\ChatRoomMember;
use App\Models\Company;
use App\Models\User;

test('messages with identical created_at are ordered by ascending id', function () {
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

    $timestamp = now()->startOfSecond();

    $userMessage = ChatMessage::query()->create([
        'room_id' => $room->id,
        'sender_type' => 'user',
        'sender_id' => $user->id,
        'user_id' => $user->id,
        'message' => 'Hello',
        'is_bot' => false,
        'created_at' => $timestamp,
        'updated_at' => $timestamp,
    ]);

    $botMessage = ChatMessage::query()->create([
        'room_id' => $room->id,
        'sender_type' => 'company',
        'sender_id' => $company->id,
        'message' => 'Hi there',
        'is_bot' => true,
        'created_at' => $timestamp,
        'updated_at' => $timestamp,
    ]);

    expect($userMessage->id)->toBeLessThan($botMessage->id);

    $response = $this->actingAs($user)->getJson("/webapi/chat/rooms/{$room->id}/messages");

    $response->assertOk();

    $ids = collect($response->json('data'))->pluck('id')->all();

    expect($ids)->toContain($userMessage->id, $botMessage->id);

    $sortedIds = collect($ids)
        ->sort(function (int $leftId, int $rightId) use ($response): int {
            $messages = collect($response->json('data'))->keyBy('id');
            $leftTime = strtotime((string) $messages[$leftId]['created_at']);
            $rightTime = strtotime((string) $messages[$rightId]['created_at']);

            if ($leftTime !== $rightTime) {
                return $leftTime <=> $rightTime;
            }

            return $leftId <=> $rightId;
        })
        ->values()
        ->all();

    expect($sortedIds)->toBe([
        $userMessage->id,
        $botMessage->id,
    ]);
});
