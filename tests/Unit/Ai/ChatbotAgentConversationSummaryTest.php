<?php

use App\Ai\Agents\ChatbotAgent;
use App\Models\AppConfig;
use App\Models\ChatMessage;
use App\Models\ChatRoom;
use App\Models\ChatRoomMember;
use App\Models\Company;
use App\Models\User;

test('chatbot stores conversation summary on chat room meta after long threads', function () {
    AppConfig::updateOrCreate(['key' => 'chatbot'], [
        'value' => [
            'chatbot_model_name' => 'deepseek/deepseek-v4-flash',
            'embedding_model_name' => 'openai/text-embedding-3-small',
            'chatbot_model_provider' => 'openrouter',
            'embedding_model_provider' => 'openrouter',
            'user_cost_per_interaction' => '75',
            'prompt_token_cost_per_million' => '1800',
            'embedding_token_cost_per_million' => '400',
            'completion_token_cost_per_million' => '2000',
        ],
    ]);

    ChatbotAgent::fake([
        'Customer asked about Hong Kong tours and booking status.',
        'Hello streamed world',
    ]);

    $company = Company::factory()->create();
    $company->aiCredit()->update(['balance' => 10_000]);
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

    foreach ([
        'Any Hong Kong tours?',
        'We have several options available.',
        'What about departures in May?',
        'Let me check schedules for you.',
        'Do I have a booking already?',
        'I can look that up for you.',
    ] as $index => $text) {
        ChatMessage::withoutEvents(fn (): ChatMessage => ChatMessage::query()->create([
            'room_id' => $room->id,
            'sender_type' => $index % 2 === 0 ? 'user' : 'company',
            'sender_id' => $index % 2 === 0 ? $user->id : $company->id,
            'user_id' => $index % 2 === 0 ? $user->id : null,
            'message' => $text,
            'is_bot' => $index % 2 === 1,
        ]));
    }

    $message = ChatMessage::withoutEvents(fn (): ChatMessage => ChatMessage::query()->create([
        'room_id' => $room->id,
        'sender_type' => 'user',
        'sender_id' => $user->id,
        'user_id' => $user->id,
        'message' => 'Please summarize my options',
        'is_bot' => false,
    ]));

    ChatbotAgent::make($message->fresh(['room.members']))->reply();

    $room->refresh();

    expect(data_get($room->meta, 'conversation_summary'))
        ->toContain('Hong Kong')
        ->and(data_get($room->meta, 'summary_through_message_id'))
        ->not->toBeNull();
});

test('chatbot instructions include stored conversation summary', function () {
    AppConfig::updateOrCreate(['key' => 'chatbot'], [
        'value' => [
            'chatbot_model_name' => 'deepseek/deepseek-v4-flash',
            'embedding_model_name' => 'openai/text-embedding-3-small',
            'chatbot_model_provider' => 'openrouter',
            'embedding_model_provider' => 'openrouter',
            'user_cost_per_interaction' => '75',
            'prompt_token_cost_per_million' => '1800',
            'embedding_token_cost_per_million' => '400',
            'completion_token_cost_per_million' => '2000',
        ],
    ]);

    $company = Company::factory()->create();
    $company->aiCredit()->update(['balance' => 10_000]);
    $user = User::factory()->create();

    $room = ChatRoom::query()->create([
        'type' => 'private',
        'name' => null,
        'meta' => [
            'conversation_summary' => 'Customer previously asked about Bali tours.',
            'summary_through_message_id' => 1,
        ],
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

    $message = ChatMessage::withoutEvents(fn (): ChatMessage => ChatMessage::query()->create([
        'room_id' => $room->id,
        'sender_type' => 'user',
        'sender_id' => $user->id,
        'user_id' => $user->id,
        'message' => 'Any updates?',
        'is_bot' => false,
    ]));

    $agent = ChatbotAgent::make($message->fresh(['room.members']));

    expect($agent->instructions())->toContain('Earlier conversation summary: Customer previously asked about Bali tours.');
});
