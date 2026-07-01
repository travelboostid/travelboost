<?php

use App\Ai\Agents\ChatbotAgent;
use App\Models\AppConfig;
use App\Models\ChatMessage;
use App\Models\ChatRoom;
use App\Models\ChatRoomMember;
use App\Models\Company;
use App\Models\User;

test('chatbot company contact context returns company contact fields', function () {
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

    $company = Company::factory()->create([
        'name' => 'Travel Boost Tours',
        'email' => 'hello@travelboost.test',
        'address' => '123 Main Street, Jakarta',
        'phone' => '0211111111',
        'customer_service_phone' => '081234567890',
    ]);
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

    $message = ChatMessage::withoutEvents(fn (): ChatMessage => ChatMessage::query()->create([
        'room_id' => $room->id,
        'sender_type' => 'user',
        'sender_id' => $user->id,
        'user_id' => $user->id,
        'message' => 'What is your contact number?',
        'is_bot' => false,
    ]));

    $agent = ChatbotAgent::make($message->fresh(['room.members']));

    $method = new ReflectionMethod(ChatbotAgent::class, 'retrieveCompanyContactContext');
    $method->setAccessible(true);

    $context = $method->invoke($agent);

    expect($context)
        ->toContain('company:name|email|address|cs_phone')
        ->toContain('Travel Boost Tours|hello@travelboost.test|123 Main Street, Jakarta|081234567890');
});

test('chatbot company contact context falls back to phone when cs phone is empty', function () {
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

    $company = Company::factory()->create([
        'phone' => '02199998888',
        'customer_service_phone' => '',
    ]);
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

    $message = ChatMessage::withoutEvents(fn (): ChatMessage => ChatMessage::query()->create([
        'room_id' => $room->id,
        'sender_type' => 'user',
        'sender_id' => $user->id,
        'user_id' => $user->id,
        'message' => 'Contact info please',
        'is_bot' => false,
    ]));

    $agent = ChatbotAgent::make($message->fresh(['room.members']));

    $method = new ReflectionMethod(ChatbotAgent::class, 'retrieveCompanyContactContext');
    $method->setAccessible(true);

    $context = $method->invoke($agent);

    expect($context)->toContain('|02199998888');
});
