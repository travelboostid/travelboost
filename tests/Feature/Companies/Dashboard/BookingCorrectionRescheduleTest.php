<?php

use App\Actions\Booking\CancelOverdueDownPaymentBookingsAction;
use App\Actions\Booking\FinalizeBookingPaymentAction;
use App\Actions\Booking\RescheduleBookingAction;
use App\Enums\BookingStatus;
use App\Enums\CompanyTeamStatus;
use App\Enums\PaymentStatus;
use App\Models\AppConfig;
use App\Models\Booking;
use App\Models\BookingActionRequest;
use App\Models\BookingPassenger;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Payment;
use App\Models\PriceCategory;
use App\Models\Tour;
use App\Models\TourAvailability;
use App\Models\TourPrice;
use App\Models\TourSchedule;
use App\Models\User;
use App\Notifications\BookingPaymentNotification;
use App\Services\BookingPricingService;
use App\Support\BookingReschedulePayment;
use Database\Seeders\Common\RolePermissionSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

beforeEach(function () {
    /** @var TestCase $this */
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);
    Booking::unsetEventDispatcher();
    DB::table('continents')->insertOrIgnore(['id' => 1, 'name' => 'Asia']);
    DB::table('regions')->insertOrIgnore(['id' => 1, 'name' => 'Southeast Asia', 'continent_id' => 1]);
    DB::table('countries')->insertOrIgnore(['id' => 1, 'name' => 'Indonesia', 'continent_id' => 1, 'region_id' => 1]);
    $this->user = User::factory()->create();
});

function createRescheduleScenario(): array
{
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $agent = Company::factory()->create(['type' => 'agent']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $currentDeparture = now()->addMonths(2)->toDateString();
    $newDeparture = now()->addMonths(3)->toDateString();

    $currentSchedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $vendor->id,
        'departure_date' => $currentDeparture,
        'return_date' => now()->addMonths(2)->addDays(5)->toDateString(),
        'is_active' => true,
    ]);
    $newSchedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $vendor->id,
        'departure_date' => $newDeparture,
        'return_date' => now()->addMonths(3)->addDays(5)->toDateString(),
        'is_active' => true,
    ]);

    TourAvailability::create([
        'company_id' => $vendor->id,
        'tour_id' => $tour->id,
        'schedule_id' => $currentSchedule->id,
        'max_pax' => 10,
        'available' => 6,
        'DP' => 4,
    ]);
    TourAvailability::create([
        'company_id' => $vendor->id,
        'tour_id' => $tour->id,
        'schedule_id' => $newSchedule->id,
        'max_pax' => 10,
        'available' => 8,
    ]);

    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $tour->id,
        'user_id' => User::factory()->create()->id,
        'booking_number' => 'BKG-RESCHEDULE-001',
        'departure_date' => $currentDeparture,
        'status' => BookingStatus::DOWN_PAYMENT,
        'pax_adult' => 2,
        'pax_child' => 0,
        'grand_total' => 10_000_000,
    ]);

    Payment::create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 2_000_000,
        'status' => PaymentStatus::PAID,
        'payload' => ['payment_type' => 'down_payment'],
    ]);

    return compact('vendor', 'agent', 'tour', 'booking', 'currentSchedule', 'newSchedule', 'currentDeparture', 'newDeparture');
}

function attachCompanyTeam(User $user, Company $company): void
{
    CompanyTeam::create([
        'company_id' => $company->id,
        'user_id' => $user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);
}

function setupSettlementWalletInfrastructure(Company $vendor, int $vendorBalance = 50_000_000): void
{
    AppConfig::updateOrCreate(['key' => 'admin'], [
        'description' => 'Admin Parameter configuration',
        'value' => [
            'platform_fee' => '30000',
            'commission_min' => '50000',
            'commission_mid' => '75000',
            'commission_max' => '75000',
        ],
    ]);

    $rootUser = User::query()
        ->where('username', 'root')
        ->orWhere('email', 'root@travelboost.co.id')
        ->first();

    if (! $rootUser) {
        $rootUser = User::factory()->create([
            'name' => 'Travelboost Root',
            'username' => 'root',
            'email' => 'root@travelboost.co.id',
        ]);
    }

    if (! $rootUser->wallet) {
        $rootUser->wallet()->create(['balance' => 0, 'name' => 'Root Wallet']);
    }

    if (! $vendor->wallet) {
        $vendor->wallet()->create(['balance' => $vendorBalance, 'name' => 'Vendor Wallet']);

        return;
    }

    if ((int) $vendor->wallet->balance < $vendorBalance) {
        $vendor->wallet->deposit($vendorBalance - (int) $vendor->wallet->balance, ['type' => 'test-wallet-topup']);
    }
}

/**
 * JSON encodes whole-number floats as integers; compare money values numerically.
 */
function inertiaMoneyEquals(float $expected): Closure
{
    return fn (mixed $actual): bool => abs((float) $actual - $expected) < 0.01;
}

test('agent can submit a reschedule request for a down payment booking', function () {
    ['vendor' => $vendor, 'agent' => $agent, 'booking' => $booking, 'newSchedule' => $newSchedule] = createRescheduleScenario();
    $agentUser = User::factory()->create();
    attachCompanyTeam($agentUser, $agent);

    $response = $this->actingAs($agentUser)
        ->from("/companies/{$agent->username}/dashboard/bookings")
        ->post("/companies/{$agent->username}/dashboard/bookings/{$booking->id}/reschedule", [
            'schedule_id' => $newSchedule->id,
            'reason' => 'Customer requested new date',
        ]);

    $response->assertRedirect("/companies/{$agent->username}/dashboard/bookings");
    $response->assertSessionHas('success');

    expect($booking->fresh()->departure_date?->toDateString())->toBe($booking->departure_date?->toDateString());

    $request = BookingActionRequest::query()
        ->where('booking_id', $booking->id)
        ->where('target_action', 'reschedule')
        ->first();

    expect($request)->not->toBeNull()
        ->and($request->status)->toBe('pending')
        ->and(data_get($request->payload, 'requested_schedule_id'))->toBe($newSchedule->id);
});

test('vendor can approve an agent reschedule request and notify the customer', function () {
    Notification::fake();

    ['vendor' => $vendor, 'agent' => $agent, 'booking' => $booking, 'newSchedule' => $newSchedule, 'newDeparture' => $newDeparture] = createRescheduleScenario();
    $vendorUser = User::factory()->create();
    attachCompanyTeam($vendorUser, $vendor);

    $actionRequest = BookingActionRequest::create([
        'booking_id' => $booking->id,
        'requester_company_id' => $agent->id,
        'requester_user_id' => $this->user->id,
        'target_action' => 'reschedule',
        'status' => 'pending',
        'reason' => 'Please move to next month',
        'payload' => [
            'requested_schedule_id' => $newSchedule->id,
            'requested_departure_date' => $newDeparture,
            'previous_departure_date' => $booking->departure_date?->toDateString(),
        ],
    ]);

    $response = $this->actingAs($vendorUser)
        ->post("/companies/{$vendor->username}/dashboard/booking-correction/{$actionRequest->id}/approve");

    $response->assertRedirect();
    $response->assertSessionHas('success');

    expect($booking->fresh()->departure_date?->toDateString())->toBe($newDeparture)
        ->and($booking->fresh()->status)->toBe(BookingStatus::DOWN_PAYMENT)
        ->and($actionRequest->fresh()->status)->toBe('approved');

    Notification::assertSentTo(
        $booking->fresh()->user,
        BookingPaymentNotification::class,
        fn (BookingPaymentNotification $notification): bool => $notification->stage === 'booking_rescheduled_balance_due'
    );
});

test('vendor can directly reschedule a full payment booking', function () {
    ['vendor' => $vendor, 'booking' => $booking, 'newSchedule' => $newSchedule, 'newDeparture' => $newDeparture] = createRescheduleScenario();
    attachCompanyTeam($this->user, $vendor);

    $booking->update(['status' => BookingStatus::FULL_PAYMENT]);

    Payment::create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 10_000_000,
        'status' => PaymentStatus::PAID,
        'payload' => ['payment_type' => 'full_payment'],
    ]);

    $response = $this->actingAs($this->user)
        ->post("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/reschedule", [
            'schedule_id' => $newSchedule->id,
            'reason' => 'Vendor moved departure',
        ]);

    $response->assertRedirect();
    expect($booking->fresh()->departure_date?->toDateString())->toBe($newDeparture)
        ->and($booking->fresh()->status)->toBe(BookingStatus::FULL_PAYMENT);
});

test('system-cancelled booking can be reactivated by vendor to down payment', function () {
    Notification::fake();

    $vendor = Company::factory()->create(['type' => 'vendor']);
    $vendor->settings()->updateOrCreate(
        ['company_id' => $vendor->id],
        ['full_payment_deadline' => 7],
    );
    attachCompanyTeam($this->user, $vendor);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $departureDate = now()->addDays(20)->toDateString();
    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $vendor->id,
        'departure_date' => $departureDate,
        'return_date' => now()->addDays(25)->toDateString(),
        'is_active' => true,
    ]);
    TourAvailability::create([
        'company_id' => $vendor->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 10,
        'available' => 8,
        'CA' => 2,
    ]);

    $customer = User::factory()->create();
    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'user_id' => $customer->id,
        'departure_date' => $departureDate,
        'status' => BookingStatus::DOWN_PAYMENT,
        'pax_adult' => 2,
        'pax_child' => 0,
    ]);

    Payment::create([
        'owner_type' => User::class,
        'owner_id' => $customer->id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 1_000_000,
        'status' => PaymentStatus::PAID,
        'payload' => ['payment_type' => 'down_payment'],
    ]);

    $this->travelTo(now()->addDays(16)->startOfDay()->addHour());

    app(CancelOverdueDownPaymentBookingsAction::class)->execute();

    expect($booking->fresh()->status)->toBe(BookingStatus::CANCELLED);

    $response = $this->actingAs($this->user)
        ->post("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/restore", [
            'reason' => 'Customer will complete payment',
        ]);

    $response->assertRedirect();
    expect($booking->fresh()->status)->toBe(BookingStatus::DOWN_PAYMENT);

    Notification::assertSentTo(
        $customer,
        BookingPaymentNotification::class,
        fn (BookingPaymentNotification $notification): bool => $notification->stage === 'booking_reactivated'
    );
});

test('manually cancelled booking can be reactivated by agent request and vendor approval', function () {
    ['vendor' => $vendor, 'agent' => $agent, 'booking' => $booking] = createRescheduleScenario();
    $agentUser = User::factory()->create();
    $vendorUser = User::factory()->create();
    attachCompanyTeam($agentUser, $agent);
    attachCompanyTeam($vendorUser, $vendor);

    $booking->update(['status' => BookingStatus::CANCELLED]);

    BookingActionRequest::create([
        'booking_id' => $booking->id,
        'requester_company_id' => $vendor->id,
        'requester_user_id' => $vendorUser->id,
        'target_action' => 'cancel',
        'status' => 'approved',
        'reason' => 'Cancelled by vendor after customer request',
        'reviewer_company_id' => $vendor->id,
        'reviewer_user_id' => $vendorUser->id,
        'reviewed_at' => now(),
    ]);

    $this->actingAs($agentUser)
        ->post("/companies/{$agent->username}/dashboard/bookings/{$booking->id}/restore", [
            'reason' => 'Customer wants to continue',
        ])
        ->assertRedirect();

    $restoreRequest = BookingActionRequest::query()
        ->where('booking_id', $booking->id)
        ->where('target_action', 'restore')
        ->where('status', 'pending')
        ->first();

    expect($restoreRequest)->not->toBeNull();

    $this->actingAs($vendorUser)
        ->post("/companies/{$vendor->username}/dashboard/booking-correction/{$restoreRequest->id}/approve")
        ->assertRedirect();

    expect($booking->fresh()->status)->toBe(BookingStatus::DOWN_PAYMENT);
});

test('bookings index exposes can_reschedule and can_reactivate flags', function () {
    ['vendor' => $vendor, 'agent' => $agent, 'booking' => $booking, 'newSchedule' => $newSchedule] = createRescheduleScenario();
    attachCompanyTeam($this->user, $agent);

    $this->actingAs($this->user)
        ->get("/companies/{$agent->username}/dashboard/bookings")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('data.data.0.can_reschedule', true)
            ->where('data.data.0.can_reactivate', false));

    $booking->update(['status' => BookingStatus::CANCELLED]);

    $this->actingAs($this->user)
        ->get("/companies/{$agent->username}/dashboard/bookings?status=cancelled")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('data.data.0.can_reschedule', false)
            ->where('data.data.0.can_reactivate', true));
});

test('reschedule options endpoint returns alternative schedules lazily', function () {
    ['vendor' => $vendor, 'booking' => $booking, 'newSchedule' => $newSchedule, 'newDeparture' => $newDeparture] = createRescheduleScenario();
    attachCompanyTeam($this->user, $vendor);

    $response = $this->actingAs($this->user)
        ->getJson("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/reschedule-options");

    $response->assertOk()
        ->assertJsonPath('schedules.0.id', $newSchedule->id)
        ->assertJsonPath('schedules.0.departure_date', $newDeparture);
});

test('reschedule options return schedule-specific pricing previews', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'booking' => $booking, 'currentSchedule' => $currentSchedule, 'newSchedule' => $newSchedule] = createRescheduleScenario();
    attachCompanyTeam($this->user, $vendor);

    $priceCategory = PriceCategory::create([
        'company_id' => $vendor->id,
        'name' => 'Adult Single',
        'room_type' => 'single',
    ]);

    TourPrice::create([
        'company_id' => $vendor->id,
        'tour_code' => $tour->code,
        'schedule_id' => $currentSchedule->id,
        'price_category_id' => $priceCategory->id,
        'currency' => 'IDR',
        'price' => 10_000_000,
        'promotion_rate' => 10,
    ]);
    TourPrice::create([
        'company_id' => $vendor->id,
        'tour_code' => $tour->code,
        'schedule_id' => $newSchedule->id,
        'price_category_id' => $priceCategory->id,
        'currency' => 'IDR',
        'price' => 21_000_000,
        'promotion_rate' => 10,
    ]);

    BookingPassenger::factory()->create([
        'booking_id' => $booking->id,
        'price_category' => 'Adult Single',
        'price_amount' => 9_000_000,
    ]);

    $booking->update([
        'status' => BookingStatus::FULL_PAYMENT,
        'grand_total' => 9_025_000,
        'platform_fee' => 25_000,
        'tax_rate' => 0,
        'tax_amount' => 0,
        'total_price' => 10_000_000,
    ]);

    $expectedNewTotal = (float) app(BookingPricingService::class)->quoteForBookingData(
        $tour,
        $newSchedule->departure_date,
        [['price_category' => 'Adult Single']],
    )['grand_total'];

    $response = $this->actingAs($this->user)
        ->getJson("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/reschedule-options");

    $response->assertOk();

    $newSchedulePreview = collect($response->json('schedules'))
        ->firstWhere('id', $newSchedule->id);

    expect($newSchedulePreview)->not->toBeNull()
        ->and((float) $newSchedulePreview['price_preview']['grand_total'])->toBe($expectedNewTotal)
        ->and((float) $newSchedulePreview['price_preview']['grand_total'])->not->toBe((float) $booking->grand_total)
        ->and((float) $newSchedulePreview['price_preview']['price_difference'])->toBe(round($expectedNewTotal - 9_025_000, 2));
});

test('vendor direct reschedule reprices booking and downgrades status when new total exceeds paid amount', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'booking' => $booking, 'newSchedule' => $newSchedule] = createRescheduleScenario();
    attachCompanyTeam($this->user, $vendor);

    $priceCategory = PriceCategory::create([
        'company_id' => $vendor->id,
        'name' => 'Adult Single',
        'room_type' => 'single',
    ]);

    TourPrice::create([
        'company_id' => $vendor->id,
        'tour_code' => $tour->code,
        'schedule_id' => $newSchedule->id,
        'price_category_id' => $priceCategory->id,
        'currency' => 'IDR',
        'price' => 21_000_000,
        'promotion_rate' => 10,
    ]);

    BookingPassenger::factory()->create([
        'booking_id' => $booking->id,
        'price_category' => 'Adult Single',
        'price_amount' => 9_000_000,
    ]);

    $booking->update([
        'status' => BookingStatus::FULL_PAYMENT,
        'grand_total' => 10_000_000,
        'platform_fee' => 25_000,
        'tax_rate' => 0,
        'tax_amount' => 0,
        'total_price' => 10_000_000,
    ]);

    Payment::create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 10_000_000,
        'status' => PaymentStatus::PAID,
        'payload' => ['payment_type' => 'full_payment'],
    ]);

    $expectedNewTotal = (float) app(BookingPricingService::class)->quoteForBookingData(
        $tour,
        $newSchedule->departure_date,
        [['price_category' => 'Adult Single']],
    )['grand_total'];

    $this->actingAs($this->user)
        ->post("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/reschedule", [
            'schedule_id' => $newSchedule->id,
            'reason' => 'Move to pricier date',
        ])
        ->assertRedirect();

    $booking->refresh();
    $passenger = $booking->passengers()->first();

    expect((float) $booking->grand_total)->toBe($expectedNewTotal)
        ->and($booking->status)->toBe(BookingStatus::DOWN_PAYMENT)
        ->and($passenger)->not->toBeNull()
        ->and((float) $passenger->price_amount)->toBe(18_900_000.0);
});

test('vendor direct reschedule can waive customer price adjustment when new total is higher', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'booking' => $booking, 'newSchedule' => $newSchedule] = createRescheduleScenario();
    attachCompanyTeam($this->user, $vendor);

    $priceCategory = PriceCategory::create([
        'company_id' => $vendor->id,
        'name' => 'Adult Single',
        'room_type' => 'single',
    ]);

    TourPrice::create([
        'company_id' => $vendor->id,
        'tour_code' => $tour->code,
        'schedule_id' => $newSchedule->id,
        'price_category_id' => $priceCategory->id,
        'currency' => 'IDR',
        'price' => 21_000_000,
        'promotion_rate' => 10,
    ]);

    BookingPassenger::factory()->create([
        'booking_id' => $booking->id,
        'price_category' => 'Adult Single',
        'price_amount' => 9_000_000,
    ]);

    $booking->update([
        'status' => BookingStatus::FULL_PAYMENT,
        'grand_total' => 10_000_000,
        'platform_fee' => 25_000,
        'tax_rate' => 0,
        'tax_amount' => 0,
        'total_price' => 10_000_000,
    ]);

    Payment::create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 10_000_000,
        'status' => PaymentStatus::PAID,
        'payload' => ['payment_type' => 'full_payment'],
    ]);

    Notification::fake();

    $this->actingAs($this->user)
        ->post("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/reschedule", [
            'schedule_id' => $newSchedule->id,
            'reason' => 'Vendor absorbs increase',
            'apply_customer_price_adjustment' => false,
        ])
        ->assertRedirect();

    $booking->refresh();
    $actionRequest = BookingActionRequest::query()
        ->where('booking_id', $booking->id)
        ->where('target_action', 'reschedule')
        ->latest('id')
        ->first();

    expect($booking->status)->toBe(BookingStatus::FULL_PAYMENT)
        ->and(data_get($actionRequest?->payload, 'apply_customer_price_adjustment'))->toBeFalse();

    Notification::assertNotSentTo(
        $booking->user,
        BookingPaymentNotification::class,
        fn (BookingPaymentNotification $notification): bool => $notification->stage === 'booking_rescheduled_balance_due'
    );
});

test('vendor direct reschedule can waive customer refund when new total is lower', function () {
    Notification::fake();

    ['vendor' => $vendor, 'tour' => $tour, 'booking' => $booking, 'newSchedule' => $newSchedule] = createRescheduleScenario();
    attachCompanyTeam($this->user, $vendor);

    $priceCategory = PriceCategory::create([
        'company_id' => $vendor->id,
        'name' => 'Adult Single',
        'room_type' => 'single',
    ]);

    TourPrice::create([
        'company_id' => $vendor->id,
        'tour_code' => $tour->code,
        'schedule_id' => $newSchedule->id,
        'price_category_id' => $priceCategory->id,
        'currency' => 'IDR',
        'price' => 5_000_000,
        'promotion_rate' => 0,
    ]);

    BookingPassenger::factory()->create([
        'booking_id' => $booking->id,
        'price_category' => 'Adult Single',
        'price_amount' => 9_000_000,
    ]);

    $booking->update([
        'status' => BookingStatus::FULL_PAYMENT,
        'grand_total' => 10_000_000,
        'platform_fee' => 25_000,
        'tax_rate' => 0,
        'tax_amount' => 0,
        'total_price' => 10_000_000,
    ]);

    Payment::create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 10_000_000,
        'status' => PaymentStatus::PAID,
        'payload' => ['payment_type' => 'full_payment'],
    ]);

    $this->actingAs($this->user)
        ->post("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/reschedule", [
            'schedule_id' => $newSchedule->id,
            'apply_customer_price_adjustment' => false,
        ])
        ->assertRedirect();

    $booking->refresh();

    expect($booking->status)->toBe(BookingStatus::FULL_PAYMENT)
        ->and((float) $booking->grand_total)->toBeLessThan(10_000_000);

    Notification::assertNotSentTo(
        $booking->user,
        BookingPaymentNotification::class,
        fn (BookingPaymentNotification $notification): bool => $notification->stage === 'booking_rescheduled_credit'
    );
});

test('vendor can approve agent reschedule request without applying customer price adjustment', function () {
    Notification::fake();

    ['vendor' => $vendor, 'agent' => $agent, 'tour' => $tour, 'booking' => $booking, 'newSchedule' => $newSchedule, 'newDeparture' => $newDeparture] = createRescheduleScenario();
    $vendorUser = User::factory()->create();
    attachCompanyTeam($vendorUser, $vendor);

    $priceCategory = PriceCategory::create([
        'company_id' => $vendor->id,
        'name' => 'Adult Single',
        'room_type' => 'single',
    ]);

    TourPrice::create([
        'company_id' => $vendor->id,
        'tour_code' => $tour->code,
        'schedule_id' => $newSchedule->id,
        'price_category_id' => $priceCategory->id,
        'currency' => 'IDR',
        'price' => 21_000_000,
        'promotion_rate' => 10,
    ]);

    BookingPassenger::factory()->create([
        'booking_id' => $booking->id,
        'price_category' => 'Adult Single',
        'price_amount' => 9_000_000,
    ]);

    $booking->update([
        'status' => BookingStatus::FULL_PAYMENT,
        'grand_total' => 10_000_000,
        'platform_fee' => 25_000,
        'tax_rate' => 0,
        'tax_amount' => 0,
        'total_price' => 10_000_000,
    ]);

    Payment::create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 10_000_000,
        'status' => PaymentStatus::PAID,
        'payload' => ['payment_type' => 'full_payment'],
    ]);

    $pricePreview = app(RescheduleBookingAction::class)
        ->previewPricingChange($booking->fresh(), $newSchedule);

    $actionRequest = BookingActionRequest::create([
        'booking_id' => $booking->id,
        'requester_company_id' => $agent->id,
        'requester_user_id' => $this->user->id,
        'target_action' => 'reschedule',
        'status' => 'pending',
        'reason' => 'Please move to next month',
        'payload' => [
            'requested_schedule_id' => $newSchedule->id,
            'requested_departure_date' => $newDeparture,
            'previous_departure_date' => $booking->departure_date?->toDateString(),
            'price_before' => (float) $booking->grand_total,
            'price_after' => $pricePreview['grand_total'],
            'price_difference' => $pricePreview['price_difference'],
        ],
    ]);

    $this->actingAs($vendorUser)
        ->post("/companies/{$vendor->username}/dashboard/booking-correction/{$actionRequest->id}/approve", [
            'apply_customer_price_adjustment' => false,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $booking->refresh();
    $actionRequest->refresh();

    expect($booking->status)->toBe(BookingStatus::FULL_PAYMENT)
        ->and(data_get($actionRequest->payload, 'apply_customer_price_adjustment'))->toBeFalse();
});

test('agent reschedule request always stores customer price adjustment as true even when false is submitted', function () {
    ['vendor' => $vendor, 'agent' => $agent, 'booking' => $booking, 'newSchedule' => $newSchedule] = createRescheduleScenario();
    $agentUser = User::factory()->create();
    attachCompanyTeam($agentUser, $agent);

    $this->actingAs($agentUser)
        ->post("/companies/{$agent->username}/dashboard/bookings/{$booking->id}/reschedule", [
            'schedule_id' => $newSchedule->id,
            'reason' => 'Customer requested new date',
            'apply_customer_price_adjustment' => false,
        ])
        ->assertRedirect();

    $request = BookingActionRequest::query()
        ->where('booking_id', $booking->id)
        ->where('target_action', 'reschedule')
        ->first();

    expect($request)->not->toBeNull()
        ->and(data_get($request->payload, 'apply_customer_price_adjustment'))->toBeTrue();
});

test('waived reschedule does not expose credit balance on bookings index', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'booking' => $booking, 'newSchedule' => $newSchedule] = createRescheduleScenario();
    attachCompanyTeam($this->user, $vendor);

    $priceCategory = PriceCategory::create([
        'company_id' => $vendor->id,
        'name' => 'Adult Single',
        'room_type' => 'single',
    ]);

    TourPrice::create([
        'company_id' => $vendor->id,
        'tour_code' => $tour->code,
        'schedule_id' => $newSchedule->id,
        'price_category_id' => $priceCategory->id,
        'currency' => 'IDR',
        'price' => 5_000_000,
        'promotion_rate' => 0,
    ]);

    BookingPassenger::factory()->create([
        'booking_id' => $booking->id,
        'price_category' => 'Adult Single',
        'price_amount' => 9_000_000,
    ]);

    $booking->update([
        'status' => BookingStatus::FULL_PAYMENT,
        'grand_total' => 10_000_000,
        'platform_fee' => 25_000,
        'tax_rate' => 0,
        'tax_amount' => 0,
        'total_price' => 10_000_000,
    ]);

    Payment::query()->where('payable_id', $booking->id)->delete();

    Payment::create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 10_000_000,
        'status' => PaymentStatus::PAID,
        'payload' => ['payment_type' => 'full_payment'],
    ]);

    $this->actingAs($this->user)
        ->post("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/reschedule", [
            'schedule_id' => $newSchedule->id,
            'apply_customer_price_adjustment' => false,
        ])
        ->assertRedirect();

    $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('companies/dashboard/bookings/index')
            ->has('data.data', 1)
            ->where('data.data.0.booking_number', $booking->booking_number)
            ->where('data.data.0.payment_followup.state', 'completed')
            ->where('data.data.0.remaining_balance', 0));
});

function createPriceIncreaseRescheduleScenario(): array
{
    ['vendor' => $vendor, 'agent' => $agent, 'tour' => $tour, 'booking' => $booking, 'newSchedule' => $newSchedule, 'newDeparture' => $newDeparture] = createRescheduleScenario();

    $priceCategory = PriceCategory::create([
        'company_id' => $vendor->id,
        'name' => 'Adult Single',
        'room_type' => 'single',
    ]);

    TourPrice::create([
        'company_id' => $vendor->id,
        'tour_code' => $tour->code,
        'schedule_id' => $newSchedule->id,
        'price_category_id' => $priceCategory->id,
        'currency' => 'IDR',
        'price' => 21_000_000,
        'promotion_rate' => 10,
    ]);

    BookingPassenger::factory()->create([
        'booking_id' => $booking->id,
        'price_category' => 'Adult Single',
        'price_amount' => 9_000_000,
    ]);

    Payment::query()->where('payable_id', $booking->id)->delete();

    Payment::create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 10_000_000,
        'status' => PaymentStatus::PAID,
        'payload' => ['payment_type' => 'full_payment'],
    ]);

    $booking->update([
        'status' => BookingStatus::FULL_PAYMENT,
        'grand_total' => 10_000_000,
        'platform_fee' => 25_000,
        'tax_rate' => 0,
        'tax_amount' => 0,
        'total_price' => 10_000_000,
    ]);

    $expectedNewTotal = (float) app(BookingPricingService::class)->quoteForBookingData(
        $tour,
        $newSchedule->departure_date,
        [['price_category' => 'Adult Single']],
    )['grand_total'];

    return compact('vendor', 'agent', 'tour', 'booking', 'newSchedule', 'newDeparture', 'expectedNewTotal');
}

test('vendor approving agent reschedule downgrades full payment to down payment when price increases', function () {
    Notification::fake();

    ['vendor' => $vendor, 'agent' => $agent, 'booking' => $booking, 'newSchedule' => $newSchedule, 'newDeparture' => $newDeparture, 'expectedNewTotal' => $expectedNewTotal] = createPriceIncreaseRescheduleScenario();
    $vendorUser = User::factory()->create();
    attachCompanyTeam($vendorUser, $vendor);

    $pricePreview = app(RescheduleBookingAction::class)
        ->previewPricingChange($booking->fresh(), $newSchedule);

    $actionRequest = BookingActionRequest::create([
        'booking_id' => $booking->id,
        'requester_company_id' => $agent->id,
        'requester_user_id' => User::factory()->create()->id,
        'target_action' => 'reschedule',
        'status' => 'pending',
        'reason' => 'Customer requested new date',
        'payload' => [
            'requested_schedule_id' => $newSchedule->id,
            'requested_departure_date' => $newDeparture,
            'previous_departure_date' => $booking->departure_date?->toDateString(),
            'price_before' => (float) $booking->grand_total,
            'price_after' => $pricePreview['grand_total'],
            'price_difference' => $pricePreview['price_difference'],
            'apply_customer_price_adjustment' => true,
        ],
    ]);

    $this->actingAs($vendorUser)
        ->post("/companies/{$vendor->username}/dashboard/booking-correction/{$actionRequest->id}/approve", [
            'apply_customer_price_adjustment' => true,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $booking->refresh();
    $actionRequest->refresh();

    expect($booking->departure_date?->toDateString())->toBe($newDeparture)
        ->and((float) $booking->grand_total)->toBe($expectedNewTotal)
        ->and($booking->status)->toBe(BookingStatus::DOWN_PAYMENT)
        ->and($actionRequest->status)->toBe('approved')
        ->and(data_get($actionRequest->payload, 'apply_customer_price_adjustment'))->toBeTrue();

    Notification::assertSentTo(
        $booking->user,
        BookingPaymentNotification::class,
        fn (BookingPaymentNotification $notification): bool => $notification->stage === 'booking_rescheduled_balance_due'
    );

    Notification::assertNotSentTo(
        $booking->user,
        BookingPaymentNotification::class,
        fn (BookingPaymentNotification $notification): bool => $notification->stage === 'booking_rescheduled'
    );
});

test('vendor approving agent reschedule exposes payment follow-up when price increases', function () {
    ['vendor' => $vendor, 'booking' => $booking, 'newSchedule' => $newSchedule, 'newDeparture' => $newDeparture, 'expectedNewTotal' => $expectedNewTotal] = createPriceIncreaseRescheduleScenario();
    $vendorUser = User::factory()->create();
    attachCompanyTeam($vendorUser, $vendor);

    $pricePreview = app(RescheduleBookingAction::class)
        ->previewPricingChange($booking->fresh(), $newSchedule);

    $actionRequest = BookingActionRequest::create([
        'booking_id' => $booking->id,
        'requester_company_id' => $booking->agent_id,
        'requester_user_id' => User::factory()->create()->id,
        'target_action' => 'reschedule',
        'status' => 'pending',
        'reason' => 'Customer requested new date',
        'payload' => [
            'requested_schedule_id' => $newSchedule->id,
            'requested_departure_date' => $newDeparture,
            'previous_departure_date' => $booking->departure_date?->toDateString(),
            'price_before' => (float) $booking->grand_total,
            'price_after' => $pricePreview['grand_total'],
            'price_difference' => $pricePreview['price_difference'],
        ],
    ]);

    $this->actingAs($vendorUser)
        ->post("/companies/{$vendor->username}/dashboard/booking-correction/{$actionRequest->id}/approve")
        ->assertRedirect();

    $booking->refresh();

    $expectedRemaining = app(BookingReschedulePayment::class)->remainingBalance($booking);

    $this->actingAs($vendorUser)
        ->get("/companies/{$vendor->username}/dashboard/bookings")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('data.data.0.booking_number', $booking->booking_number)
            ->where('data.data.0.status', BookingStatus::DOWN_PAYMENT->value)
            ->where('data.data.0.remaining_balance_visible', true)
            ->where('data.data.0.remaining_balance', inertiaMoneyEquals($expectedRemaining))
            ->where('data.data.0.payment_followup.state', 'due')
            ->where('data.data.0.payment_followup.amount_due', inertiaMoneyEquals($expectedRemaining))
            ->where('data.data.0.payment_followup.action_label', 'Complete Payment'));
});

test('dashboard payment step exposes correct remaining balance after repriced reschedule', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'booking' => $booking, 'newSchedule' => $newSchedule, 'newDeparture' => $newDeparture] = createPriceIncreaseRescheduleScenario();
    $vendorUser = User::factory()->create();
    attachCompanyTeam($vendorUser, $vendor);

    app(RescheduleBookingAction::class)->execute($booking->fresh(), $newSchedule, true);

    $booking->refresh();
    $expectedRemaining = app(BookingReschedulePayment::class)->remainingBalance($booking);

    $this->actingAs($vendorUser)
        ->get("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}?date={$newDeparture}&booking_number={$booking->booking_number}&step=payment")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('tours/bookings/create')
            ->where('isResumingExistingBooking', true)
            ->where('remainingBalance', inertiaMoneyEquals($expectedRemaining))
            ->where('paidAmount', inertiaMoneyEquals(10_000_000.0)));
});

test('completing reschedule remaining balance restores full payment status', function () {
    ['vendor' => $vendor, 'booking' => $booking, 'newSchedule' => $newSchedule] = createPriceIncreaseRescheduleScenario();
    setupSettlementWalletInfrastructure($vendor);
    $vendorUser = User::factory()->create();
    attachCompanyTeam($vendorUser, $vendor);

    app(RescheduleBookingAction::class)->execute($booking->fresh(), $newSchedule, true);
    $booking->refresh();

    $remaining = app(BookingReschedulePayment::class)->remainingBalance($booking);

    expect($booking->status)->toBe(BookingStatus::DOWN_PAYMENT)
        ->and($remaining)->toBeGreaterThan(0);

    $topUpPayment = Payment::create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => $remaining,
        'status' => PaymentStatus::PAID,
        'paid_at' => now(),
        'payload' => ['payment_type' => 'full_payment'],
    ]);

    app(FinalizeBookingPaymentAction::class)->execute($booking->fresh(), $topUpPayment);

    expect($booking->fresh()->status)->toBe(BookingStatus::FULL_PAYMENT);
});

test('rescheduled full payment booking shows prior payment in down payment column', function () {
    ['vendor' => $vendor, 'booking' => $booking, 'newSchedule' => $newSchedule, 'newDeparture' => $newDeparture] = createPriceIncreaseRescheduleScenario();
    $vendorUser = User::factory()->create();
    attachCompanyTeam($vendorUser, $vendor);

    $pricePreview = app(RescheduleBookingAction::class)
        ->previewPricingChange($booking->fresh(), $newSchedule);

    $actionRequest = BookingActionRequest::create([
        'booking_id' => $booking->id,
        'requester_company_id' => $booking->agent_id,
        'requester_user_id' => User::factory()->create()->id,
        'target_action' => 'reschedule',
        'status' => 'approved',
        'reason' => 'Customer requested new date',
        'payload' => [
            'requested_schedule_id' => $newSchedule->id,
            'requested_departure_date' => $newDeparture,
            'previous_departure_date' => $booking->departure_date?->toDateString(),
            'price_before' => (float) $booking->grand_total,
            'price_after' => $pricePreview['grand_total'],
            'price_difference' => $pricePreview['price_difference'],
            'apply_customer_price_adjustment' => true,
        ],
        'reviewer_company_id' => $vendor->id,
        'reviewer_user_id' => $vendorUser->id,
        'reviewed_at' => now(),
    ]);

    app(RescheduleBookingAction::class)->execute(
        $booking->fresh(),
        $newSchedule,
        true,
    );

    $this->actingAs($vendorUser)
        ->get("/companies/{$vendor->username}/dashboard/bookings")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('data.data.0.booking_number', $booking->booking_number)
            ->where('data.data.0.status', BookingStatus::DOWN_PAYMENT->value)
            ->where('data.data.0.was_rescheduled', true)
            ->where('data.data.0.down_payment_detail.display_label', 'Prior full payment (reschedule)')
            ->where('data.data.0.down_payment_detail.amount', 10_000_000)
            ->where('data.data.0.full_payment_detail', null));
});

test('vendor approving agent reschedule without price adjustment keeps full payment status', function () {
    ['vendor' => $vendor, 'agent' => $agent, 'booking' => $booking, 'newSchedule' => $newSchedule, 'newDeparture' => $newDeparture] = createPriceIncreaseRescheduleScenario();
    $vendorUser = User::factory()->create();
    attachCompanyTeam($vendorUser, $vendor);

    $pricePreview = app(RescheduleBookingAction::class)
        ->previewPricingChange($booking->fresh(), $newSchedule);

    $actionRequest = BookingActionRequest::create([
        'booking_id' => $booking->id,
        'requester_company_id' => $agent->id,
        'requester_user_id' => User::factory()->create()->id,
        'target_action' => 'reschedule',
        'status' => 'pending',
        'reason' => 'Vendor absorbs increase',
        'payload' => [
            'requested_schedule_id' => $newSchedule->id,
            'requested_departure_date' => $newDeparture,
            'previous_departure_date' => $booking->departure_date?->toDateString(),
            'price_before' => (float) $booking->grand_total,
            'price_after' => $pricePreview['grand_total'],
            'price_difference' => $pricePreview['price_difference'],
        ],
    ]);

    $this->actingAs($vendorUser)
        ->post("/companies/{$vendor->username}/dashboard/booking-correction/{$actionRequest->id}/approve", [
            'apply_customer_price_adjustment' => false,
        ])
        ->assertRedirect();

    expect($booking->fresh()->status)->toBe(BookingStatus::FULL_PAYMENT);
});

test('finalize payment after waived reschedule keeps full payment status', function () {
    ['vendor' => $vendor, 'booking' => $booking, 'newSchedule' => $newSchedule, 'newDeparture' => $newDeparture] = createPriceIncreaseRescheduleScenario();
    setupSettlementWalletInfrastructure($vendor);
    $priceBefore = (float) $booking->grand_total;

    app(RescheduleBookingAction::class)->execute($booking->fresh(), $newSchedule, false);
    $booking->refresh();

    BookingActionRequest::create([
        'booking_id' => $booking->id,
        'requester_company_id' => $booking->agent_id,
        'requester_user_id' => User::factory()->create()->id,
        'target_action' => 'reschedule',
        'status' => 'approved',
        'reason' => 'Vendor absorbs increase',
        'payload' => [
            'requested_schedule_id' => $newSchedule->id,
            'requested_departure_date' => $newDeparture,
            'previous_departure_date' => $booking->departure_date?->toDateString(),
            'price_before' => $priceBefore,
            'price_after' => (float) $booking->grand_total,
            'apply_customer_price_adjustment' => false,
        ],
        'reviewed_at' => now(),
    ]);

    expect($booking->status)->toBe(BookingStatus::FULL_PAYMENT)
        ->and((float) $booking->grand_total)->toBeGreaterThan($priceBefore);

    app(FinalizeBookingPaymentAction::class)->execute($booking->fresh(), notify: false);

    expect($booking->fresh()->status)->toBe(BookingStatus::FULL_PAYMENT);
});
