<?php

use App\Ai\Agents\ChatbotAgent;
use App\Enums\BookingStatus;
use App\Enums\CompanyType;
use App\Enums\TourStatus;
use App\Models\AppConfig;
use App\Models\Booking;
use App\Models\ChatMessage;
use App\Models\ChatRoom;
use App\Models\ChatRoomMember;
use App\Models\Company;
use App\Models\PriceCategory;
use App\Models\Tour;
use App\Models\TourAvailability;
use App\Models\TourPrice;
use App\Models\TourSchedule;
use App\Models\User;

function createChatbotAgentCompany(array $attributes = []): Company
{
    return Company::factory()->create(array_merge([
        'type' => CompanyType::AGENT,
    ], $attributes));
}

function createAgentChatCustomer(Company $company, array $attributes = []): User
{
    $user = User::factory()->create(array_merge([
        'company_id' => $company->id,
    ], $attributes));

    if (! $user->hasRole('user:customer')) {
        $user->addRole('user:customer');
    }

    return $user;
}

function createBookingReservationChatMessage(Company $company, User $user, string $messageText): ChatMessage
{
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

    return ChatMessage::withoutEvents(fn (): ChatMessage => ChatMessage::query()->create([
        'room_id' => $room->id,
        'sender_type' => 'user',
        'sender_id' => $user->id,
        'user_id' => $user->id,
        'message' => $messageText,
        'is_bot' => false,
    ]));
}

function createBookingReservationChatbotAgent(Company $company, User $user, ChatMessage $message): ChatbotAgent
{
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

    $company->aiCredit()->update(['balance' => 10_000]);

    return ChatbotAgent::make($message->fresh(['room.members']));
}

test('chatbot customer profile context returns user contact details when logged in', function () {
    $company = createChatbotAgentCompany();
    $user = createAgentChatCustomer($company, [
        'name' => 'Jane Customer',
        'email' => 'jane@example.test',
        'phone' => '08123456789',
    ]);

    $message = createBookingReservationChatMessage($company, $user, 'Book this tour');
    $agent = createBookingReservationChatbotAgent($company, $user, $message);

    $method = new ReflectionMethod(ChatbotAgent::class, 'retrieveCustomerProfileContext');
    $method->setAccessible(true);

    $context = $method->invoke($agent);

    expect($context)
        ->toContain('customer:id|name|username|email|phone')
        ->toContain('Jane Customer')
        ->toContain('jane@example.test')
        ->toContain('08123456789');
});

test('chatbot customer profile context prompts login for anonymous chat users', function () {
    $company = createChatbotAgentCompany();
    $user = createAgentChatCustomer($company);

    $message = createBookingReservationChatMessage($company, $user, 'Book this tour');
    $message->update(['sender_type' => 'anonymous-user']);

    $agent = createBookingReservationChatbotAgent($company, $user, $message->fresh(['room.members']));

    $method = new ReflectionMethod(ChatbotAgent::class, 'retrieveCustomerProfileContext');
    $method->setAccessible(true);

    expect($method->invoke($agent))->toContain('Login required');
});

test('chatbot booking ops reject customers registered with another agent', function () {
    $company = createChatbotAgentCompany();
    $otherCompany = createChatbotAgentCompany();
    $user = createAgentChatCustomer($otherCompany);

    $message = createBookingReservationChatMessage($company, $user, 'Book a tour');
    $agent = createBookingReservationChatbotAgent($company, $user, $message);

    $profileMethod = new ReflectionMethod(ChatbotAgent::class, 'retrieveCustomerProfileContext');
    $profileMethod->setAccessible(true);

    expect($profileMethod->invoke($agent))->toContain('wrong_agent');

    $reserveMethod = new ReflectionMethod(ChatbotAgent::class, 'reserveBookingContext');
    $reserveMethod->setAccessible(true);

    expect($reserveMethod->invoke($agent, [
        'tour_id' => 1,
        'passengers_json' => '[]',
    ]))->toContain('wrong_agent');
});

test('chatbot booking quote context lists price categories for a departure', function () {
    $company = createChatbotAgentCompany();
    $user = createAgentChatCustomer($company);

    $tour = Tour::factory()->create([
        'company_id' => $company->id,
        'status' => TourStatus::ACTIVE,
    ]);

    $schedule = TourSchedule::query()->create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $company->id,
        'departure_date' => now()->addDays(20)->toDateString(),
        'return_date' => now()->addDays(25)->toDateString(),
        'is_active' => true,
    ]);

    TourAvailability::query()->create([
        'company_id' => $company->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 10,
        'available' => 10,
    ]);

    $category = PriceCategory::query()->create([
        'company_id' => $company->id,
        'name' => 'Adult Single',
        'room_type' => 'single',
    ]);

    TourPrice::query()->create([
        'company_id' => $company->id,
        'tour_code' => $tour->code,
        'schedule_id' => $schedule->id,
        'price_category_id' => $category->id,
        'currency' => 'IDR',
        'price' => 17_500_000,
    ]);

    $message = createBookingReservationChatMessage($company, $user, 'How much for one adult?');
    $agent = createBookingReservationChatbotAgent($company, $user, $message);

    $method = new ReflectionMethod(ChatbotAgent::class, 'retrieveBookingQuoteContext');
    $method->setAccessible(true);

    $context = $method->invoke($agent, [
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
    ]);

    expect($context)
        ->toContain('price_categories:category|price|description')
        ->toContain('Adult Single')
        ->toContain('17500000');
});

test('chatbot reserve booking context creates a reserved booking and queues my bookings action', function () {
    $company = createChatbotAgentCompany();
    $user = createAgentChatCustomer($company, [
        'name' => 'Muhammad Irvan Hermawan',
        'email' => 'irvan.herz@gmail.com',
        'phone' => '0000',
    ]);

    $tour = Tour::factory()->create([
        'company_id' => $company->id,
        'status' => TourStatus::ACTIVE,
    ]);

    $schedule = TourSchedule::query()->create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $company->id,
        'departure_date' => now()->addDays(20)->toDateString(),
        'return_date' => now()->addDays(25)->toDateString(),
        'is_active' => true,
    ]);

    TourAvailability::query()->create([
        'company_id' => $company->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 10,
        'available' => 10,
    ]);

    $category = PriceCategory::query()->create([
        'company_id' => $company->id,
        'name' => 'Adult Single',
        'room_type' => 'Single room (1 person)',
    ]);

    TourPrice::query()->create([
        'company_id' => $company->id,
        'tour_code' => $tour->code,
        'schedule_id' => $schedule->id,
        'price_category_id' => $category->id,
        'currency' => 'IDR',
        'price' => 17_500_000,
    ]);

    $message = createBookingReservationChatMessage($company, $user, 'Please reserve for me');
    $agent = createBookingReservationChatbotAgent($company, $user, $message);

    $passengersJson = json_encode([
        [
            'title' => 'Mr',
            'first_name' => 'sad',
            'last_name' => 'asdsa',
            'dob' => '2000-07-01',
            'pob' => 'jkt',
            'price_category' => 'Adult Single',
            'price_amount' => 17_500_000,
            'room_type' => 'Single room (1 person)',
        ],
    ], JSON_THROW_ON_ERROR);

    $method = new ReflectionMethod(ChatbotAgent::class, 'reserveBookingContext');
    $method->setAccessible(true);

    $context = $method->invoke($agent, [
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'pax_adult' => 1,
        'pax_child' => 0,
        'pax_infant' => 0,
        'contact_name' => 'Muhammad Irvan Hermawan',
        'contact_email' => 'irvan.herz@gmail.com',
        'contact_phone' => '0000',
        'contact_notes' => 'ss',
        'passengers_json' => $passengersJson,
    ]);

    expect($context)->toContain('reserved:booking_number');

    $booking = Booking::query()->where('user_id', $user->id)->first();

    expect($booking)
        ->not->toBeNull()
        ->and($booking->status)->toBe(BookingStatus::BOOKING_RESERVED)
        ->and($booking->tour_id)->toBe($tour->id)
        ->and($booking->contact_email)->toBe('irvan.herz@gmail.com');

    $actionsProperty = new ReflectionProperty(ChatbotAgent::class, 'botMessageActions');
    $actionsProperty->setAccessible(true);
    $actions = $actionsProperty->getValue($agent);

    expect($actions)
        ->toHaveCount(1)
        ->and($actions[0]['label'])->toBe('View my booking')
        ->and($actions[0]['href'])->toContain('/mybookings')
        ->and($actions[0]['href'])->toContain(urlencode((string) $booking->booking_number));
});

test('chatbot reorder expired booking reactivates booking and queues continue actions', function () {
    $company = createChatbotAgentCompany();
    $user = createAgentChatCustomer($company);

    $tour = Tour::factory()->create([
        'company_id' => $company->id,
        'status' => TourStatus::ACTIVE,
    ]);

    $schedule = TourSchedule::query()->create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $company->id,
        'departure_date' => now()->addDays(20)->toDateString(),
        'return_date' => now()->addDays(25)->toDateString(),
        'is_active' => true,
    ]);

    TourAvailability::query()->create([
        'company_id' => $company->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 10,
        'available' => 10,
    ]);

    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'agent_id' => $company->id,
        'vendor_id' => $company->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::EXPIRED,
        'booking_number' => 'BKG-CHAT-REORDER',
        'departure_date' => $schedule->departure_date,
        'reserved_type' => 'system',
        'reserved_expires_at' => null,
    ]);

    $message = createBookingReservationChatMessage($company, $user, 'Reorder my expired booking');
    $agent = createBookingReservationChatbotAgent($company, $user, $message);

    $method = new ReflectionMethod(ChatbotAgent::class, 'reorderExpiredBookingContext');
    $method->setAccessible(true);

    $context = $method->invoke($agent, ['booking_number' => 'BKG-CHAT-REORDER']);

    expect($context)
        ->toContain('reordered:status')
        ->toContain('reactivated')
        ->toContain('BKG-CHAT-REORDER');

    expect($booking->fresh()->status)->toBe(BookingStatus::AWAITING_PAYMENT);

    $actionsProperty = new ReflectionProperty(ChatbotAgent::class, 'botMessageActions');
    $actionsProperty->setAccessible(true);
    $actions = $actionsProperty->getValue($agent);

    expect($actions)
        ->toHaveCount(2)
        ->and($actions[0]['label'])->toBe('Continue booking')
        ->and($actions[0]['href'])->toContain('/bookings/'.$tour->id.'/create')
        ->and($actions[1]['label'])->toBe('View my booking');
});

test('chatbot release booking hold expires active reserved booking', function () {
    $company = createChatbotAgentCompany();
    $user = createAgentChatCustomer($company);

    $tour = Tour::factory()->create([
        'company_id' => $company->id,
        'status' => TourStatus::ACTIVE,
    ]);

    $schedule = TourSchedule::query()->create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $company->id,
        'departure_date' => now()->addDays(20)->toDateString(),
        'return_date' => now()->addDays(25)->toDateString(),
        'is_active' => true,
    ]);

    TourAvailability::query()->create([
        'company_id' => $company->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 10,
        'available' => 8,
    ]);

    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'agent_id' => $company->id,
        'vendor_id' => $company->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::BOOKING_RESERVED,
        'booking_number' => 'BKG-CHAT-RELEASE',
        'departure_date' => $schedule->departure_date,
        'reserved_type' => 'system',
        'reserved_expires_at' => now()->addMinutes(8),
        'pax_adult' => 2,
    ]);

    $message = createBookingReservationChatMessage($company, $user, 'Cancel my booking hold');
    $agent = createBookingReservationChatbotAgent($company, $user, $message);

    $method = new ReflectionMethod(ChatbotAgent::class, 'releaseBookingHoldContext');
    $method->setAccessible(true);

    $context = $method->invoke($agent, ['booking_id' => $booking->id]);

    expect($context)
        ->toContain('hold_released:booking_number')
        ->toContain('BKG-CHAT-RELEASE');

    expect($booking->fresh()->status)->toBe(BookingStatus::EXPIRED);

    $actionsProperty = new ReflectionProperty(ChatbotAgent::class, 'botMessageActions');
    $actionsProperty->setAccessible(true);
    $actions = $actionsProperty->getValue($agent);

    expect($actions)->toHaveCount(1)
        ->and($actions[0]['label'])->toBe('View my bookings');
});
