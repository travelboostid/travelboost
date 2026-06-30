<?php

use App\Ai\Agents\ChatbotAgent;
use App\Enums\BookingStatus;
use App\Enums\CompanyType;
use App\Models\AppConfig;
use App\Models\Booking;
use App\Models\ChatMessage;
use App\Models\ChatRoom;
use App\Models\ChatRoomMember;
use App\Models\Company;
use App\Models\Tour;
use App\Models\User;
use Laravel\Ai\Messages\Message;

function createChatbotAgentCompanyForBookingContext(array $attributes = []): Company
{
    return Company::factory()->create(array_merge([
        'type' => CompanyType::AGENT,
    ], $attributes));
}

function createAgentChatCustomerForBookingContext(Company $company, array $attributes = []): User
{
    $user = User::factory()->create(array_merge([
        'company_id' => $company->id,
    ], $attributes));

    if (! $user->hasRole('user:customer')) {
        $user->addRole('user:customer');
    }

    return $user;
}

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

    $company = createChatbotAgentCompanyForBookingContext();
    $company->aiCredit()->update(['balance' => 10_000]);

    $user = createAgentChatCustomerForBookingContext($company);
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

    $company = createChatbotAgentCompanyForBookingContext();
    $company->aiCredit()->update(['balance' => 10_000]);

    $user = createAgentChatCustomerForBookingContext($company);

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

    expect($context)->toBe('No bookings matched.');
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

    $company = createChatbotAgentCompanyForBookingContext();
    $user = createAgentChatCustomerForBookingContext($company);

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

    $company = createChatbotAgentCompanyForBookingContext();
    $company->aiCredit()->update(['balance' => 10_000]);

    $user = createAgentChatCustomerForBookingContext($company);
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

test('chatbot booking query context filters by status and upcoming departure', function () {
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

    $company = createChatbotAgentCompanyForBookingContext();
    $company->aiCredit()->update(['balance' => 10_000]);

    $user = createAgentChatCustomerForBookingContext($company);
    $tour = Tour::factory()->create(['company_id' => $company->id]);

    Booking::factory()->create([
        'user_id' => $user->id,
        'agent_id' => $company->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::FULL_PAYMENT,
        'booking_number' => '0001-202606-UPCOMING',
        'departure_date' => now()->addWeek()->toDateString(),
    ]);

    Booking::factory()->create([
        'user_id' => $user->id,
        'agent_id' => $company->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::CANCELLED,
        'booking_number' => '0001-202606-CANCEL1',
        'departure_date' => now()->addWeeks(2)->toDateString(),
    ]);

    Booking::factory()->create([
        'user_id' => $user->id,
        'agent_id' => $company->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::FULL_PAYMENT,
        'booking_number' => '0001-202606-PAST001',
        'departure_date' => now()->subMonth()->toDateString(),
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
        'message' => 'booking saya yang akan berangkat',
        'is_bot' => false,
    ]));

    $agent = ChatbotAgent::make($message->fresh(['room.members']));

    $method = new ReflectionMethod(ChatbotAgent::class, 'retrieveBookingQueryContext');
    $method->setAccessible(true);

    $context = $method->invoke($agent, [
        'statuses' => ['full payment'],
        'upcoming_only' => true,
    ]);

    expect($context)
        ->toContain('0001-202606-UPCOMING')
        ->not->toContain('0001-202606-CANCEL1')
        ->not->toContain('0001-202606-PAST001');
});

test('chatbot booking query context filters by booking number keywords', function () {
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

    $company = createChatbotAgentCompanyForBookingContext();
    $company->aiCredit()->update(['balance' => 10_000]);

    $user = createAgentChatCustomerForBookingContext($company);
    $baliTour = Tour::factory()->create(['company_id' => $company->id, 'name' => 'Bali Adventure']);
    $tokyoTour = Tour::factory()->create(['company_id' => $company->id, 'name' => 'Tokyo Highlights']);

    Booking::factory()->create([
        'user_id' => $user->id,
        'agent_id' => $company->id,
        'tour_id' => $baliTour->id,
        'status' => BookingStatus::FULL_PAYMENT,
        'booking_number' => '0001-202606-BALI01',
    ]);

    Booking::factory()->create([
        'user_id' => $user->id,
        'agent_id' => $company->id,
        'tour_id' => $tokyoTour->id,
        'status' => BookingStatus::FULL_PAYMENT,
        'booking_number' => '0001-202606-TOKYO1',
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
        'message' => 'cari booking bali',
        'is_bot' => false,
    ]));

    $agent = ChatbotAgent::make($message->fresh(['room.members']));

    $method = new ReflectionMethod(ChatbotAgent::class, 'retrieveBookingQueryContext');
    $method->setAccessible(true);

    $context = $method->invoke($agent, ['keywords' => 'Bali']);

    expect($context)
        ->toContain('0001-202606-BALI01')
        ->not->toContain('0001-202606-TOKYO1');
});
