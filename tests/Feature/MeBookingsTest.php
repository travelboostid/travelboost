<?php

use App\Actions\Booking\ExpireBookingReservationsAction;
use App\Actions\WaitingList\OfferWaitingListSeatAction;
use App\Enums\BookingStatus;
use App\Enums\CompanyTeamStatus;
use App\Enums\MediaType;
use App\Enums\PaymentStatus;
use App\Enums\TourWaitingListScheduleStatus;
use App\Enums\UserStatus;
use App\Enums\VendorAgentPartnerStatus;
use App\Http\Middleware\UseCustomerProps;
use App\Models\Booking;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Domain;
use App\Models\Media;
use App\Models\Tour;
use App\Models\TourAvailability;
use App\Models\TourSchedule;
use App\Models\User;
use App\Models\VendorAgentPartner;
use Database\Seeders\Common\RolePermissionSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);
    Booking::unsetEventDispatcher();
    DB::table('continents')->insertOrIgnore(['id' => 1, 'name' => 'Asia']);
    DB::table('regions')->insertOrIgnore(['id' => 1, 'name' => 'Southeast Asia', 'continent_id' => 1]);
    DB::table('countries')->insertOrIgnore(['id' => 1, 'name' => 'Indonesia', 'continent_id' => 1, 'region_id' => 1]);
});

test('guests can view the my bookings page shell', function () {
    $response = $this->get('/mybookings');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('me/bookings')
        ->where('bookings', null)
        ->where('favorites', null)
        ->where('activeTab', 'current'));
});

test('shared tenant props include landing page settings for navbar branding', function () {
    $company = Company::factory()->create([
        'username' => 'john',
        'type' => 'agent',
        'name' => 'John Company',
    ]);
    $landingPageData = json_encode([
        'root' => [
            'props' => [
                'title' => 'Travel',
                'theme' => 'dark',
            ],
        ],
    ]);

    $company->settings()->updateOrCreate([
        'company_id' => $company->id,
    ], [
        'landing_page_data' => $landingPageData,
    ]);

    $request = Request::create('/mybookings');
    Context::add('tenant', $company);
    $request->setLaravelSession(app('session')->driver());

    app(UseCustomerProps::class)->handle($request, fn (Request $request) => response('ok'));

    expect(Inertia::getShared('tenant')->settings->landing_page_data)->toBe($landingPageData);
});

test('agent subdomains can view my bookings when subdomain access is enabled', function () {
    $company = Company::factory()->create([
        'username' => 'mybookingagent',
        'type' => 'agent',
    ]);
    Domain::create([
        'subdomain' => 'mybookingagent',
        'owner_type' => Company::class,
        'owner_id' => $company->id,
        'domain_enabled' => false,
        'subdomain_enabled' => true,
    ]);

    $response = $this->get('http://mybookingagent.lvh.me/mybookings');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('me/bookings')
        ->where('activeTab', 'current'));
});

test('authenticated users see only active and future bookings in current and terminal bookings in history', function () {
    $user = User::factory()->create(['status' => UserStatus::ACTIVE]);
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);

    Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'reserved',
        'booking_number' => 'BKG-CURRENT-001',
        'departure_date' => now()->addDays(10)->toDateString(),
        'created_at' => now()->subDays(6),
    ]);

    Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'expired',
        'booking_number' => 'BKG-CURRENT-EXPIRED',
        'departure_date' => now()->addDays(8)->toDateString(),
        'created_at' => now()->subDays(5),
    ]);

    Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'awaiting payment',
        'booking_number' => 'BKG-CURRENT-AWAITING',
        'departure_date' => now()->addDays(6)->toDateString(),
        'created_at' => now()->subDays(4),
    ]);

    Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'full payment',
        'booking_number' => 'BKG-CURRENT-FUTURE-FP',
        'departure_date' => now()->addDays(4)->toDateString(),
        'created_at' => now()->subDays(3),
    ]);

    Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'expired',
        'booking_number' => 'BKG-HIDDEN-PAST-EXPIRED',
        'departure_date' => now()->subDay()->toDateString(),
        'created_at' => now()->subDays(2),
    ]);

    Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'awaiting payment',
        'booking_number' => 'BKG-HIDDEN-PAST-AWAITING',
        'departure_date' => now()->subDay()->toDateString(),
        'created_at' => now()->subDay(),
    ]);

    Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'full payment',
        'booking_number' => 'BKG-HISTORY-PAST-FP',
        'departure_date' => now()->subDay()->toDateString(),
        'created_at' => now(),
    ]);

    Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'cancelled',
        'booking_number' => 'BKG-HISTORY-CANCELLED',
        'departure_date' => now()->addDays(12)->toDateString(),
        'created_at' => now()->addSecond(),
    ]);

    Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'refunded',
        'booking_number' => 'BKG-HISTORY-REFUNDED',
        'departure_date' => now()->addDays(14)->toDateString(),
        'created_at' => now()->addSeconds(2),
    ]);

    $response = $this->actingAs($user)->get('/mybookings?tab=current');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('activeTab', 'current')
        ->has('bookings.data', 4)
        ->where('bookings.data.0.booking_number', 'BKG-CURRENT-FUTURE-FP')
        ->where('bookings.data.1.booking_number', 'BKG-CURRENT-AWAITING')
        ->where('bookings.data.2.booking_number', 'BKG-CURRENT-EXPIRED')
        ->where('bookings.data.3.booking_number', 'BKG-CURRENT-001'));

    $response = $this->actingAs($user)->get('/mybookings?tab=history');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('activeTab', 'history')
        ->has('bookings.data', 5)
        ->where('bookings.data.0.booking_number', 'BKG-HISTORY-REFUNDED')
        ->where('bookings.data.1.booking_number', 'BKG-HISTORY-CANCELLED')
        ->where('bookings.data.2.booking_number', 'BKG-HISTORY-PAST-FP')
        ->where('bookings.data.3.booking_number', 'BKG-HIDDEN-PAST-AWAITING')
        ->where('bookings.data.4.booking_number', 'BKG-HIDDEN-PAST-EXPIRED'));
});

test('my bookings hides continue and reorder actions after the vendor booking deadline', function () {
    $user = User::factory()->create(['status' => UserStatus::ACTIVE]);
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $vendor->companySetting()->updateOrCreate([], [
        'booking_deadline' => 30,
    ]);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $closedDate = now()->addDays(10)->toDateString();
    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $vendor->id,
        'departure_date' => $closedDate,
        'return_date' => now()->addDays(15)->toDateString(),
        'is_active' => true,
    ]);
    TourAvailability::create([
        'company_id' => $vendor->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 20,
        'available' => 12,
    ]);

    Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::AWAITING_PAYMENT,
        'booking_number' => 'BKG-CLOSED-AWAITING',
        'departure_date' => $closedDate,
        'created_at' => now()->subMinute(),
    ]);
    Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::EXPIRED,
        'booking_number' => 'BKG-CLOSED-EXPIRED',
        'departure_date' => $closedDate,
        'created_at' => now(),
    ]);

    $response = $this->actingAs($user)->get('/mybookings?tab=current');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('activeTab', 'current')
        ->has('bookings.data', 2)
        ->where('bookings.data.0.booking_number', 'BKG-CLOSED-EXPIRED')
        ->where('bookings.data.0.can_reorder', false)
        ->where('bookings.data.0.booking_window_closed', true)
        ->where('bookings.data.0.action_unavailable_reason', 'Booking is closed')
        ->where('bookings.data.1.booking_number', 'BKG-CLOSED-AWAITING')
        ->where('bookings.data.1.can_continue_booking', false)
        ->where('bookings.data.1.booking_window_closed', true)
        ->where('bookings.data.1.action_unavailable_reason', 'Booking is closed'));
});

test('my bookings shows reordered expired booking as awaiting payment continue action', function () {
    $vendor = Company::factory()->create([
        'username' => 'freshreordervendor',
        'type' => 'vendor',
    ]);
    $user = createTenantCustomer($vendor, ['status' => UserStatus::ACTIVE]);
    Domain::create([
        'subdomain' => 'freshreordervendor',
        'owner_type' => Company::class,
        'owner_id' => $vendor->id,
        'domain_enabled' => true,
        'subdomain_enabled' => true,
    ]);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $vendor->id,
        'departure_date' => now()->addDays(20)->toDateString(),
        'return_date' => now()->addDays(25)->toDateString(),
        'is_active' => true,
    ]);
    TourAvailability::create([
        'company_id' => $vendor->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 10,
        'available' => 10,
    ]);
    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::EXPIRED,
        'booking_number' => 'BKG-FRESH-REORDER',
        'departure_date' => $schedule->departure_date,
        'reserved_type' => 'system',
        'reserved_expires_at' => null,
    ]);

    $this->actingAs($user)
        ->post("/bookings/{$booking->id}/reorder")
        ->assertRedirect();

    $response = $this->actingAs($user)->get('/mybookings?tab=current&booking_number=BKG-FRESH-REORDER');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('activeTab', 'current')
        ->where('selectedBookingNumber', 'BKG-FRESH-REORDER')
        ->has('bookings.data', 1)
        ->where('bookings.data.0.booking_number', 'BKG-FRESH-REORDER')
        ->where('bookings.data.0.status', BookingStatus::AWAITING_PAYMENT->value)
        ->where('bookings.data.0.can_continue_booking', true)
        ->where('bookings.data.0.can_reorder', false));
});

test('vendor schedule date updates sync active booking departure dates shown in my bookings', function () {
    $customer = User::factory()->create(['status' => UserStatus::ACTIVE]);
    $vendorUser = User::factory()->create(['status' => UserStatus::ACTIVE]);
    $vendor = Company::factory()->create([
        'username' => 'schedule-sync-vendor',
        'type' => 'vendor',
    ]);
    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $vendorUser->id,
        'role' => 'owner',
        'status' => CompanyTeamStatus::ACTIVE,
        'accepted_at' => now(),
        'is_owner' => true,
    ]);
    $tour = Tour::factory()->create([
        'company_id' => $vendor->id,
        'status' => 'active',
    ]);
    $oldDate = now()->addDays(40)->toDateString();
    $newDate = now()->addDays(45)->toDateString();
    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $vendor->id,
        'departure_date' => $oldDate,
        'return_date' => now()->addDays(45)->toDateString(),
        'is_active' => true,
    ]);
    $availability = TourAvailability::create([
        'company_id' => $vendor->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 10,
        'available' => 10,
    ]);

    $activeBooking = Booking::factory()->create([
        'user_id' => $customer->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::DOWN_PAYMENT,
        'booking_number' => 'BKG-SYNC-ACTIVE',
        'departure_date' => $oldDate,
        'pax_adult' => 2,
        'pax_child' => 0,
        'pax_infant' => 0,
    ]);
    $refundedBooking = Booking::factory()->create([
        'user_id' => $customer->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::REFUNDED,
        'booking_number' => 'BKG-SYNC-REFUNDED',
        'departure_date' => $oldDate,
    ]);

    $this->actingAs($vendorUser)->post(route('companies.dashboard.tours.schedules.store', [
        'company' => $vendor->username,
        'tour' => $tour->id,
    ]), [
        'schedules' => [
            [
                'id' => $schedule->id,
                'departure_date' => $newDate,
                'return_date' => now()->addDays(50)->toDateString(),
                'prices' => [],
                'availability' => [
                    'max_pax' => 10,
                    'available' => 10,
                ],
            ],
        ],
    ])->assertOk();

    expect($activeBooking->fresh()->departure_date->toDateString())->toBe($newDate)
        ->and($refundedBooking->fresh()->departure_date->toDateString())->toBe($oldDate)
        ->and((int) $availability->fresh()->DP)->toBe(2)
        ->and((int) $availability->fresh()->available)->toBe(8);

    $response = $this->actingAs($customer)->get('/mybookings?tab=current');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('bookings.data.0.booking_number', 'BKG-SYNC-ACTIVE')
        ->where('bookings.data.0.departure_date', fn (string $date): bool => str_starts_with($date, $newDate)));
});

test('my bookings deep links to a specific current booking number', function () {
    $user = User::factory()->create(['status' => UserStatus::ACTIVE]);
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);

    Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
        'booking_number' => 'BKG-HIGHLIGHT-WPA',
        'departure_date' => now()->addDays(10)->toDateString(),
    ]);

    $response = $this->actingAs($user)->get('/mybookings?tab=current&booking_number=BKG-HIGHLIGHT-WPA');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('activeTab', 'current')
        ->where('selectedBookingNumber', 'BKG-HIGHLIGHT-WPA')
        ->has('bookings.data', 1)
        ->where('bookings.data.0.booking_number', 'BKG-HIGHLIGHT-WPA'));
});

test('my bookings exposes paid balance deadlines document completeness and brochure payload', function () {
    $user = User::factory()->create(['status' => UserStatus::ACTIVE]);
    $vendor = Company::factory()->create(['type' => 'vendor', 'username' => 'derivedvendor']);
    $vendor->settings()->updateOrCreate([
        'company_id' => $vendor->id,
    ], [
        'full_payment_deadline' => 7,
        'document_completed_deadline' => 5,
    ]);
    $document = Media::create([
        'owner_type' => Company::class,
        'owner_id' => $vendor->id,
        'name' => 'Tibet itinerary.pdf',
        'type' => MediaType::DOCUMENT,
        'subtype' => 'tour-document',
        'data' => [
            'url' => '/storage/media/documents/tibet-itinerary.pdf',
            'mediaType' => 'application/pdf',
        ],
    ]);
    $departureDate = now()->addDays(20)->toDateString();
    $tour = Tour::factory()->create([
        'company_id' => $vendor->id,
        'document_id' => $document->id,
    ]);
    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::DOWN_PAYMENT,
        'booking_number' => 'BKG-DERIVED-DP',
        'departure_date' => $departureDate,
        'total_price' => 1_000_000,
        'tax_rate' => 0,
        'tax_amount' => 0,
        'platform_fee' => 0,
        'grand_total' => 1_000_000,
    ]);
    $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 300_000,
        'status' => PaymentStatus::PAID,
    ]);
    $booking->passengers()->create([
        'first_name' => 'Missing',
        'last_name' => 'Docs',
        'pob' => 'Jakarta',
        'price_category' => 'Adult Twin',
        'price_amount' => 1_000_000,
        'passport_number' => 'P1234567',
    ]);

    $response = $this->actingAs($user)->get('/mybookings?tab=current');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('activeTab', 'current')
        ->has('bookings.data', 1)
        ->where('bookings.data.0.booking_number', 'BKG-DERIVED-DP')
        ->where('bookings.data.0.paid_amount', 300000)
        ->where('bookings.data.0.remaining_balance', 700000)
        ->where('bookings.data.0.display_amount_label', 'Remaining balance')
        ->where('bookings.data.0.display_amount', 700000)
        ->where('bookings.data.0.needs_travel_documents', true)
        ->where('bookings.data.0.payment_deadline.date', now()->addDays(13)->toDateString())
        ->where('bookings.data.0.payment_deadline.days_remaining', 13)
        ->where('bookings.data.0.document_deadline.date', now()->addDays(15)->toDateString())
        ->where('bookings.data.0.document_deadline.days_remaining', 15)
        ->where('bookings.data.0.tour.document.id', $document->id)
        ->where('bookings.data.0.document_url', "/brochure/{$vendor->username}/{$tour->id}"));
});

test('my bookings excludes paid agent vendor settlement from down payment balance', function () {
    $user = User::factory()->create(['status' => UserStatus::ACTIVE]);
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $agent = Company::factory()->create(['type' => 'agent']);
    VendorAgentPartner::create([
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'status' => VendorAgentPartnerStatus::ACTIVE,
        'accepted_at' => now(),
        'payment_mode' => 'agent',
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::DOWN_PAYMENT,
        'booking_number' => 'BKG-AGENT-DP-BALANCE',
        'departure_date' => now()->addMonth()->toDateString(),
        'grand_total' => 1_000_000,
    ]);
    $customerPayment = $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'provider' => 'midtrans',
        'payment_method' => 'snap',
        'amount' => 500_000,
        'status' => PaymentStatus::PAID,
        'paid_at' => now()->subHour(),
        'payload' => [
            'booking_payment_type' => 'down_payment',
            'payment_type' => 'down_payment',
            'payment_flow_stage' => 'customer_to_agent',
            'payment_receiver_type' => 'agent',
            'payment_receiver_company_id' => $agent->id,
            'partnership_payment_mode' => 'agent',
            'agent_review_status' => 'approved',
            'vendor_review_status' => 'approved',
            'counts_toward_booking_total' => true,
        ],
    ]);
    $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'provider' => 'midtrans',
        'payment_method' => 'snap',
        'amount' => 500_000,
        'status' => PaymentStatus::PAID,
        'paid_at' => now(),
        'payload' => [
            'booking_payment_type' => 'down_payment',
            'payment_type' => 'down_payment',
            'payment_flow_stage' => 'agent_to_vendor',
            'linked_customer_payment_id' => $customerPayment->id,
            'payment_receiver_type' => 'vendor',
            'payment_receiver_company_id' => $vendor->id,
            'partnership_payment_mode' => 'agent',
            'vendor_review_status' => 'approved',
            'counts_toward_booking_total' => false,
        ],
    ]);

    $response = $this->actingAs($user)->get('/mybookings?tab=current');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('bookings.data.0.booking_number', 'BKG-AGENT-DP-BALANCE')
        ->where('bookings.data.0.paid_amount', 500000)
        ->where('bookings.data.0.remaining_balance', 500000)
        ->where('bookings.data.0.display_amount', 500000));
});

test('my bookings excludes paid agent vendor settlement from full payment total', function () {
    $user = User::factory()->create(['status' => UserStatus::ACTIVE]);
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $agent = Company::factory()->create(['type' => 'agent']);
    VendorAgentPartner::create([
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'status' => VendorAgentPartnerStatus::ACTIVE,
        'accepted_at' => now(),
        'payment_mode' => 'agent',
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::FULL_PAYMENT,
        'booking_number' => 'BKG-AGENT-FP-BALANCE',
        'departure_date' => now()->addMonth()->toDateString(),
        'grand_total' => 1_000_000,
    ]);
    $customerPayment = $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'provider' => 'midtrans',
        'payment_method' => 'snap',
        'amount' => 1_000_000,
        'status' => PaymentStatus::PAID,
        'paid_at' => now()->subHour(),
        'payload' => [
            'booking_payment_type' => 'full_payment',
            'payment_type' => 'full_payment',
            'payment_flow_stage' => 'customer_to_agent',
            'payment_receiver_type' => 'agent',
            'payment_receiver_company_id' => $agent->id,
            'partnership_payment_mode' => 'agent',
            'agent_review_status' => 'approved',
            'vendor_review_status' => 'approved',
            'counts_toward_booking_total' => true,
        ],
    ]);
    $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'provider' => 'midtrans',
        'payment_method' => 'snap',
        'amount' => 1_000_000,
        'status' => PaymentStatus::PAID,
        'paid_at' => now(),
        'payload' => [
            'booking_payment_type' => 'full_payment',
            'payment_type' => 'full_payment',
            'payment_flow_stage' => 'agent_to_vendor',
            'linked_customer_payment_id' => $customerPayment->id,
            'payment_receiver_type' => 'vendor',
            'payment_receiver_company_id' => $vendor->id,
            'partnership_payment_mode' => 'agent',
            'vendor_review_status' => 'approved',
            'counts_toward_booking_total' => false,
        ],
    ]);

    $response = $this->actingAs($user)->get('/mybookings?tab=current');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('bookings.data.0.booking_number', 'BKG-AGENT-FP-BALANCE')
        ->where('bookings.data.0.paid_amount', 1000000)
        ->where('bookings.data.0.remaining_balance', 0)
        ->where('bookings.data.0.display_amount', 1000000));
});

test('my bookings exposes waiting payment approval deadlines and document need', function () {
    $user = User::factory()->create(['status' => UserStatus::ACTIVE]);
    $vendor = Company::factory()->create(['type' => 'vendor', 'username' => 'wpadeadlinevendor']);
    $vendor->settings()->updateOrCreate([
        'company_id' => $vendor->id,
    ], [
        'full_payment_deadline' => 7,
        'document_completed_deadline' => 5,
    ]);
    $departureDate = now()->addDays(20)->toDateString();
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
        'booking_number' => 'BKG-WPA-DEADLINES',
        'departure_date' => $departureDate,
        'grand_total' => 1_000_000,
    ]);
    $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 300_000,
        'status' => PaymentStatus::PENDING,
    ]);
    $booking->passengers()->create([
        'first_name' => 'Waiting',
        'last_name' => 'Docs',
        'pob' => 'Jakarta',
        'price_category' => 'Adult Twin',
        'price_amount' => 1_000_000,
        'passport_number' => 'P1234567',
    ]);

    $response = $this->actingAs($user)->get('/mybookings?tab=current');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('bookings.data.0.booking_number', 'BKG-WPA-DEADLINES')
        ->where('bookings.data.0.status', BookingStatus::WAITING_PAYMENT_APPROVAL->value)
        ->where('bookings.data.0.needs_travel_documents', true)
        ->where('bookings.data.0.payment_deadline.date', now()->addDays(13)->toDateString())
        ->where('bookings.data.0.document_deadline.date', now()->addDays(15)->toDateString()));
});

test('my bookings lazily expires stale booking reserved rows before rendering', function () {
    $user = User::factory()->create(['status' => UserStatus::ACTIVE]);
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $vendor->id,
        'departure_date' => now()->addDays(10)->toDateString(),
        'return_date' => now()->addDays(15)->toDateString(),
        'is_active' => true,
    ]);
    TourAvailability::create([
        'company_id' => $vendor->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 20,
        'available' => 18,
    ]);

    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::BOOKING_RESERVED,
        'booking_number' => 'BKG-LAZY-EXPIRED',
        'departure_date' => $schedule->departure_date,
        'reserved_type' => 'system',
        'reserved_expires_at' => now()->subMinute(),
    ]);

    $this->travelTo(now()->addMinutes(10));
    app(ExpireBookingReservationsAction::class)->execute();

    $response = $this->actingAs($user)->get('/mybookings?tab=current');

    $response->assertOk();
    $this->assertDatabaseHas('bookings', [
        'id' => $booking->id,
        'status' => BookingStatus::EXPIRED->value,
        'reserved_expires_at' => null,
    ]);
    $response->assertInertia(fn ($page) => $page
        ->where('activeTab', 'current')
        ->has('bookings.data', 1)
        ->where('bookings.data.0.booking_number', 'BKG-LAZY-EXPIRED')
        ->where('bookings.data.0.status', BookingStatus::EXPIRED->value));
});

test('my bookings disables continue booking after vendor cancels a waiting list offer', function () {
    require_once __DIR__.'/../Support/WaitingListTestHelpers.php';

    $customer = User::factory()->create(['status' => UserStatus::ACTIVE]);
    $customer->addRole('user:customer');
    $vendorUser = User::factory()->create(['status' => UserStatus::ACTIVE]);

    ['vendor' => $vendor, 'tour' => $tour] = waitingListTourFixture();
    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $vendorUser->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $schedule = waitingListScheduleFixture($tour, available: 2);
    $waitingList = createCustomerWaitingList($tour, $customer, $schedule->id, adult: 2);
    $entry = $waitingList->schedules->firstOrFail();

    app(OfferWaitingListSeatAction::class)->execute($entry);

    $booking = Booking::query()->findOrFail($entry->fresh()->booking_id);

    $this->actingAs($customer)
        ->get('/mybookings?tab=current')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('activeTab', 'current')
            ->has('bookings.data', 1)
            ->where('bookings.data.0.booking_number', $booking->booking_number)
            ->where('bookings.data.0.status', BookingStatus::BOOKING_RESERVED->value)
            ->where('bookings.data.0.can_continue_booking', true));

    $this->actingAs($vendorUser)
        ->post("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/cancel", [
            'reason' => 'Seat offer withdrawn by vendor',
        ])
        ->assertRedirect();

    $this->actingAs($customer)
        ->get('/mybookings?tab=history')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('activeTab', 'history')
            ->has('bookings.data', 1)
            ->where('bookings.data.0.booking_number', $booking->booking_number)
            ->where('bookings.data.0.status', BookingStatus::CANCELLED->value)
            ->where('bookings.data.0.can_continue_booking', false));

    $this->actingAs($customer)
        ->get('/mybookings?tab=waiting_list')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('activeTab', 'waiting_list')
            ->where('waitingLists.data.0.schedules.0.complete_booking_href', null));
});

test('my bookings disables continue booking when a waiting list schedule is no longer offered', function () {
    require_once __DIR__.'/../Support/WaitingListTestHelpers.php';

    $customer = User::factory()->create(['status' => UserStatus::ACTIVE]);
    $customer->addRole('user:customer');

    ['tour' => $tour] = waitingListTourFixture();
    $schedule = waitingListScheduleFixture($tour, available: 2);
    $waitingList = createCustomerWaitingList($tour, $customer, $schedule->id, adult: 2);
    $entry = $waitingList->schedules->firstOrFail();

    app(OfferWaitingListSeatAction::class)->execute($entry);

    $offeredEntry = $entry->fresh();
    $booking = Booking::query()->findOrFail($offeredEntry->booking_id);

    $offeredEntry->update([
        'status' => TourWaitingListScheduleStatus::CANCELLED,
    ]);

    $response = $this->actingAs($customer)->get('/mybookings?tab=current');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('activeTab', 'current')
        ->has('bookings.data', 1)
        ->where('bookings.data.0.booking_number', $booking->booking_number)
        ->where('bookings.data.0.status', BookingStatus::CANCELLED->value)
        ->where('bookings.data.0.can_continue_booking', false));

    expect($booking->fresh()->status)->toBe(BookingStatus::BOOKING_RESERVED);
});

test('my bookings shows expired when a waiting list offer timer has elapsed', function () {
    require_once __DIR__.'/../Support/WaitingListTestHelpers.php';

    $customer = User::factory()->create(['status' => UserStatus::ACTIVE]);
    $customer->addRole('user:customer');

    ['tour' => $tour] = waitingListTourFixture();
    $schedule = waitingListScheduleFixture($tour, available: 2);
    $waitingList = createCustomerWaitingList($tour, $customer, $schedule->id, adult: 2);
    $entry = $waitingList->schedules->firstOrFail();

    app(OfferWaitingListSeatAction::class)->execute($entry);

    $offeredEntry = $entry->fresh();
    $booking = Booking::query()->findOrFail($offeredEntry->booking_id);

    $offeredEntry->update([
        'status' => TourWaitingListScheduleStatus::EXPIRED,
    ]);

    $response = $this->actingAs($customer)->get('/mybookings?tab=current');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('activeTab', 'current')
        ->has('bookings.data', 1)
        ->where('bookings.data.0.booking_number', $booking->booking_number)
        ->where('bookings.data.0.status', BookingStatus::EXPIRED->value)
        ->where('bookings.data.0.can_continue_booking', false)
        ->where('bookings.data.0.can_reorder', false));
});

test('authenticated users see liked tours in favorites', function () {
    $user = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create([
        'company_id' => $vendor->id,
        'name' => 'Saved Bali Trip',
    ]);

    DB::table('tour_likes')->insert([
        'user_id' => $user->id,
        'tour_id' => $tour->id,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $response = $this->actingAs($user)->get('/mybookings?tab=favorites');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('activeTab', 'favorites')
        ->has('favorites.data', 1)
        ->where('favorites.data.0.name', 'Saved Bali Trip'));
});

test('favorite tours include schedule payload for the schedule modal', function () {
    $user = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create([
        'company_id' => $vendor->id,
        'name' => 'Saved Hong Kong Trip',
        'showprice' => 6500000,
    ]);
    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $vendor->id,
        'departure_date' => now()->addDays(30)->toDateString(),
        'return_date' => now()->addDays(35)->toDateString(),
        'is_active' => true,
    ]);
    TourAvailability::create([
        'company_id' => $vendor->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 20,
        'available' => 12,
    ]);

    DB::table('tour_likes')->insert([
        'user_id' => $user->id,
        'tour_id' => $tour->id,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $response = $this->actingAs($user)->get('/mybookings?tab=favorites');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('activeTab', 'favorites')
        ->has('favorites.data', 1)
        ->where('favorites.data.0.id', $tour->id)
        ->where('favorites.data.0.schedules.0.departure_date', $schedule->departure_date)
        ->where('favorites.data.0.schedules.0.price', 6500000)
        ->where('favorites.data.0.schedules.0.availability.available', 12));
});

test('authenticated users can toggle a tour like', function () {
    $user = User::factory()->create(['status' => UserStatus::ACTIVE]);
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);

    $this->actingAs($user)
        ->post("/me/tours/{$tour->id}/like")
        ->assertOk()
        ->assertJson(['liked' => true]);

    $this->assertDatabaseHas('tour_likes', [
        'user_id' => $user->id,
        'tour_id' => $tour->id,
    ]);

    $this->actingAs($user)
        ->post("/me/tours/{$tour->id}/like")
        ->assertOk()
        ->assertJson(['liked' => false]);

    $this->assertDatabaseMissing('tour_likes', [
        'user_id' => $user->id,
        'tour_id' => $tour->id,
    ]);
});
