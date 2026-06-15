<?php

use App\Ai\Agents\ChatbotAgent;
use App\Enums\BookingStatus;
use App\Models\AppConfig;
use App\Models\Booking;
use App\Models\ChatMessage;
use App\Models\ChatRoom;
use App\Models\ChatRoomMember;
use App\Models\Company;
use App\Models\Tour;
use App\Models\User;
use Laravel\Ai\Messages\Message;

test('chatbot booking query context formats booking status enum values', function () {
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
    $tour = Tour::factory()->create(['company_id' => $company->id]);

    Booking::factory()->create([
        'user_id' => $user->id,
        'agent_id' => $company->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::FULL_PAYMENT,
        'booking_number' => '0001-202606-TEST01',
    ]);

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
        'message' => 'status booking saya',
        'is_bot' => false,
    ]));

    $agent = ChatbotAgent::make($message->fresh(['room.members']));

    $method = new ReflectionMethod(ChatbotAgent::class, 'retrieveBookingQueryContext');
    $method->setAccessible(true);

    $context = $method->invoke($agent, []);

    expect($context)
        ->toContain('0001-202606-TEST01')
        ->toContain('full payment');
});

test('chatbot booking query context returns explicit message when no bookings exist', function () {
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
        'message' => 'ada booking saya?',
        'is_bot' => false,
    ]));

    $agent = ChatbotAgent::make($message->fresh(['room.members']));

    $method = new ReflectionMethod(ChatbotAgent::class, 'retrieveBookingQueryContext');
    $method->setAccessible(true);

    $context = $method->invoke($agent, []);

    expect($context)->toBe('No bookings found for this customer with this company.');
});

test('chatbot ai message includes attached tour id in message content', function () {
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
        'message' => 'status booking aku',
        'attachment_type' => 'tour',
        'attachment_data' => '10',
        'is_bot' => false,
    ]));

    $agent = ChatbotAgent::make($message->fresh(['room.members']));

    $method = new ReflectionMethod(ChatbotAgent::class, 'toAiMessage');
    $method->setAccessible(true);

    /** @var Message $aiMessage */
    $aiMessage = $method->invoke($agent, $message, false);

    expect($aiMessage->content)->toContain('[Attached tour_id: 10]');
});

test('chatbot booking query context can filter by attached tour id', function () {
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
    $attachedTour = Tour::factory()->create(['company_id' => $company->id]);
    $otherTour = Tour::factory()->create(['company_id' => $company->id]);

    Booking::factory()->create([
        'user_id' => $user->id,
        'agent_id' => $company->id,
        'tour_id' => $attachedTour->id,
        'status' => BookingStatus::FULL_PAYMENT,
        'booking_number' => '0001-202606-ATTACH1',
    ]);

    Booking::factory()->create([
        'user_id' => $user->id,
        'agent_id' => $company->id,
        'tour_id' => $otherTour->id,
        'status' => BookingStatus::AWAITING_PAYMENT,
        'booking_number' => '0001-202606-OTHER1',
    ]);

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
        'message' => 'status booking aku',
        'attachment_type' => 'tour',
        'attachment_data' => (string) $attachedTour->id,
        'is_bot' => false,
    ]));

    $agent = ChatbotAgent::make($message->fresh(['room.members']));

    $method = new ReflectionMethod(ChatbotAgent::class, 'retrieveBookingQueryContext');
    $method->setAccessible(true);

    $context = $method->invoke($agent, ['tour_id' => $attachedTour->id]);

    expect($context)
        ->toContain('0001-202606-ATTACH1')
        ->not->toContain('0001-202606-OTHER1');
});
