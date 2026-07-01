<?php

use App\Actions\Booking\AssertScheduleSeatAvailabilityAction;
use App\Actions\Booking\ExpireBookingReservationsAction;
use App\Actions\Booking\FinalizeBookingPaymentAction;
use App\Actions\Booking\ReconcileOverbookedBookingsAction;
use App\Actions\Booking\SyncAvailabilityAction;
use App\Enums\BookingAvailabilityContext;
use App\Enums\BookingStatus;
use App\Models\AppConfig;
use App\Models\Booking;
use App\Models\Company;
use App\Models\Domain;
use App\Models\PriceCategory;
use App\Models\Tour;
use App\Models\TourAvailability;
use App\Models\TourPrice;
use App\Models\TourSchedule;
use App\Models\Transaction;
use App\Models\User;
use App\Services\BookingPricingService;
use App\Support\BookingAvailabilityMessages;
use Database\Seeders\Common\RolePermissionSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);
    Booking::unsetEventDispatcher();

    DB::table('continents')->insertOrIgnore(['id' => 1, 'name' => 'Asia']);
    DB::table('regions')->insertOrIgnore(['id' => 1, 'name' => 'Southeast Asia', 'continent_id' => 1]);
    DB::table('countries')->insertOrIgnore(['id' => 1, 'name' => 'Indonesia', 'continent_id' => 1, 'region_id' => 1]);

    AppConfig::updateOrCreate(['key' => 'admin'], [
        'description' => 'Admin Parameter configuration',
        'value' => [
            'platform_fee' => '30000',
            'commission_min' => '50000',
            'commission_mid' => '75000',
            'commission_max' => '75000',
        ],
    ]);

    $rootUser = User::factory()->create([
        'username' => 'root',
        'email' => 'root@travelboost.co.id',
    ]);
    $rootUser->wallet()->create(['balance' => 0, 'name' => 'Root Wallet']);
});

/**
 * @return array{
 *     customerA: User,
 *     customerB: User,
 *     vendor: Company,
 *     tour: Tour,
 *     schedule: TourSchedule,
 *     quote: array<string, mixed>
 * }
 */
function createSingleSeatRaceScenario(): array
{
    $vendor = Company::factory()->create([
        'username' => 'racevendor'.fake()->unique()->numberBetween(1000, 9999),
        'type' => 'vendor',
    ]);
    $customerA = createTenantCustomer($vendor);
    $customerB = createTenantCustomer($vendor);
    $vendor->companySetting()->updateOrCreate([], [
        'minimum_down_payment' => 30,
        'minimum_vat' => 11,
    ]);
    $vendor->wallet->deposit(5_000_000, ['type' => 'test-wallet-topup']);

    Domain::create([
        'subdomain' => $vendor->username,
        'owner_type' => Company::class,
        'owner_id' => $vendor->id,
        'domain_enabled' => true,
        'subdomain_enabled' => true,
    ]);

    $tour = Tour::factory()->create([
        'company_id' => $vendor->id,
        'code' => 'RACE-TOUR',
        'status' => 'active',
    ]);
    $schedule = TourSchedule::create([
        'company_id' => $vendor->id,
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'departure_date' => now()->addMonth()->toDateString(),
        'return_date' => now()->addMonth()->addDays(5)->toDateString(),
        'is_active' => true,
    ]);
    TourAvailability::create([
        'company_id' => $vendor->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 1,
        'available' => 1,
    ]);

    $adultSingle = PriceCategory::create([
        'company_id' => $vendor->id,
        'name' => 'Adult Single',
        'room_type' => 'single',
    ]);
    TourPrice::create([
        'company_id' => $vendor->id,
        'tour_code' => $tour->code,
        'schedule_id' => $schedule->id,
        'price_category_id' => $adultSingle->id,
        'currency' => 'IDR',
        'price' => 12_000_000,
        'commission' => 1_000_000,
        'commission_rate' => 0,
    ]);

    $quote = app(BookingPricingService::class)
        ->quoteForBookingData($tour, $schedule->departure_date, [
            ['first_name' => 'Adult', 'price_category' => 'Adult Single', 'price_amount' => 1],
        ]);

    return compact('customerA', 'customerB', 'vendor', 'tour', 'schedule', 'quote');
}

function createHeldBooking(User $customer, Company $vendor, Tour $tour, TourSchedule $schedule, array $quote, string $bookingNumber): Booking
{
    $booking = Booking::factory()->create([
        'booking_number' => $bookingNumber,
        'user_id' => $customer->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'status' => BookingStatus::BOOKING_RESERVED,
        'reserved_type' => 'system',
        'reserved_expires_at' => now()->addMinutes(10),
        'pax_adult' => 1,
        'pax_child' => 0,
        'pax_infant' => 0,
        'total_price' => $quote['subtotal_guests'],
        'tax_rate' => $quote['tax_rate'],
        'tax_amount' => $quote['tax_amount'],
        'platform_fee' => $quote['platform_fee'],
        'commission_amount' => 0,
        'grand_total' => $quote['grand_total'],
    ]);
    $booking->passengers()->createMany($quote['passengers']);
    app(SyncAvailabilityAction::class)->executeForBooking($booking);

    return $booking->fresh();
}

test('assert schedule seat availability rejects when another booking already holds the last seat', function () {
    ['customerA' => $customerA, 'customerB' => $customerB, 'vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule, 'quote' => $quote] = createSingleSeatRaceScenario();

    $winner = createHeldBooking($customerA, $vendor, $tour, $schedule, $quote, 'BKG-RACE-WINNER');
    $loser = createHeldBooking($customerB, $vendor, $tour, $schedule, $quote, 'BKG-RACE-LOSER');

    expect(fn () => app(AssertScheduleSeatAvailabilityAction::class)->assertForBooking(
        $loser,
        BookingAvailabilityContext::Payment,
    ))->toThrow(ValidationException::class);

    try {
        app(AssertScheduleSeatAvailabilityAction::class)->assertForBooking($loser, BookingAvailabilityContext::Payment);
    } catch (ValidationException $exception) {
        expect($exception->errors()['payment'][0])->toBe(BookingAvailabilityMessages::forPayment());
    }

    expect($winner->fresh()->status)->toBe(BookingStatus::BOOKING_RESERVED);
});

test('reserve rejects a second customer when the last seat is already held', function () {
    ['customerA' => $customerA, 'customerB' => $customerB, 'vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule, 'quote' => $quote] = createSingleSeatRaceScenario();

    createHeldBooking($customerA, $vendor, $tour, $schedule, $quote, 'BKG-RACE-FIRST');

    $response = $this->actingAs($customerB)
        ->from(route('bookings.create', [
            'username' => $vendor->username,
            'tour' => $tour,
            'date' => $schedule->departure_date,
        ]))
        ->post(route('bookings.reserve', [
            'username' => $vendor->username,
            'tour' => $tour,
        ]), [
            'tour_id' => $tour->id,
            'departure_date' => $schedule->departure_date,
            'pax_adult' => 1,
            'pax_child' => 0,
            'pax_infant' => 0,
            'booking_number' => 'BKG-RACE-SECOND',
            'vendor_id' => $vendor->id,
            'passengers' => [
                [
                    'first_name' => 'Second',
                    'price_category' => 'Adult Single',
                    'price_amount' => 12_000_000,
                ],
            ],
        ]);

    $response->assertSessionHasErrors('availability');
    expect(Booking::where('booking_number', 'BKG-RACE-SECOND')->exists())->toBeFalse();
});

test('online full payment is blocked for the losing booking when only one seat remains', function () {
    ['customerA' => $customerA, 'customerB' => $customerB, 'vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule, 'quote' => $quote] = createSingleSeatRaceScenario();

    createHeldBooking($customerA, $vendor, $tour, $schedule, $quote, 'BKG-RACE-FP-A');
    $loser = createHeldBooking($customerB, $vendor, $tour, $schedule, $quote, 'BKG-RACE-FP-B');

    mockPrismaLinkBookingCharge();
    $paymentMethod = createPrismaLinkBcaPaymentMethod();

    $response = $this->actingAs($customerB)
        ->postJson("/bookings/{$loser->id}/online-payment", [
            'payment_type' => 'full_payment',
            'amount' => $quote['grand_total'],
            'payment_method_id' => $paymentMethod->id,
        ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors('payment')
        ->assertJsonPath('errors.payment.0', BookingAvailabilityMessages::forPayment());

    expect($loser->payments()->count())->toBe(0);
});

test('online down payment is blocked for the losing booking when only one seat remains', function () {
    ['customerA' => $customerA, 'customerB' => $customerB, 'vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule, 'quote' => $quote] = createSingleSeatRaceScenario();

    createHeldBooking($customerA, $vendor, $tour, $schedule, $quote, 'BKG-RACE-DP-A');
    $loser = createHeldBooking($customerB, $vendor, $tour, $schedule, $quote, 'BKG-RACE-DP-B');

    mockPrismaLinkBookingCharge();
    $paymentMethod = createPrismaLinkBcaPaymentMethod();
    $downPaymentAmount = (float) ceil($quote['grand_total'] * 0.3);

    $response = $this->actingAs($customerB)
        ->postJson("/bookings/{$loser->id}/online-payment", [
            'payment_type' => 'down_payment',
            'amount' => $downPaymentAmount,
            'payment_method_id' => $paymentMethod->id,
        ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors('payment')
        ->assertJsonPath('errors.payment.0', BookingAvailabilityMessages::forPayment());

    expect($loser->payments()->count())->toBe(0);
});

test('manual payment submission is blocked for the losing booking when only one seat remains', function () {
    Storage::fake('public');
    ['customerA' => $customerA, 'customerB' => $customerB, 'vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule, 'quote' => $quote] = createSingleSeatRaceScenario();

    createHeldBooking($customerA, $vendor, $tour, $schedule, $quote, 'BKG-RACE-MAN-A');
    $loser = createHeldBooking($customerB, $vendor, $tour, $schedule, $quote, 'BKG-RACE-MAN-B');

    $response = $this->actingAs($customerB)
        ->post("/bookings/{$loser->id}/manual-payment", [
            'sender_bank_name' => 'BCA',
            'sender_account_number' => '1234567890',
            'transfer_amount' => (float) ceil($quote['grand_total'] * 0.3),
            'payment_type' => 'down_payment',
            'payment_date' => now()->toDateString(),
            'proof' => UploadedFile::fake()->image('proof.jpg'),
        ]);

    $response->assertSessionHasErrors('payment');
    expect($loser->payments()->count())->toBe(0);
});

test('full payment finalization rejects the losing booking after the winner is confirmed', function () {
    ['customerA' => $customerA, 'customerB' => $customerB, 'vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule, 'quote' => $quote] = createSingleSeatRaceScenario();

    $winner = createHeldBooking($customerA, $vendor, $tour, $schedule, $quote, 'BKG-RACE-FINAL-WIN');
    $loser = createHeldBooking($customerB, $vendor, $tour, $schedule, $quote, 'BKG-RACE-FINAL-LOSE');

    $winner->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $winner->user_id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => $quote['grand_total'],
        'status' => 'paid',
        'payload' => ['payment_type' => 'full_payment'],
    ]);

    app(FinalizeBookingPaymentAction::class)->execute($winner->fresh());

    $loserPayment = $loser->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $loser->user_id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => $quote['grand_total'],
        'status' => 'paid',
        'payload' => ['payment_type' => 'full_payment'],
    ]);

    expect(fn () => app(FinalizeBookingPaymentAction::class)->execute($loser->fresh(), $loserPayment->fresh()))
        ->toThrow(ValidationException::class);

    expect($winner->fresh()->status)->toBe(BookingStatus::FULL_PAYMENT)
        ->and($loser->fresh()->status)->toBe(BookingStatus::BOOKING_RESERVED);
});

test('down payment finalization rejects the losing booking without settling commissions', function () {
    ['customerA' => $customerA, 'customerB' => $customerB, 'vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule, 'quote' => $quote] = createSingleSeatRaceScenario();

    $winner = createHeldBooking($customerA, $vendor, $tour, $schedule, $quote, 'BKG-RACE-DPF-WIN');
    $loser = createHeldBooking($customerB, $vendor, $tour, $schedule, $quote, 'BKG-RACE-DPF-LOSE');

    $downPaymentAmount = (float) ceil($quote['grand_total'] * 0.3);

    $winner->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $winner->user_id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => $downPaymentAmount,
        'status' => 'paid',
        'payload' => ['payment_type' => 'down_payment'],
    ]);

    app(FinalizeBookingPaymentAction::class)->execute($winner->fresh());

    $loserPayment = $loser->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $loser->user_id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => $downPaymentAmount,
        'status' => 'paid',
        'payload' => ['payment_type' => 'down_payment'],
    ]);

    expect(fn () => app(FinalizeBookingPaymentAction::class)->execute($loser->fresh(), $loserPayment->fresh()))
        ->toThrow(ValidationException::class);

    expect($winner->fresh()->status)->toBe(BookingStatus::DOWN_PAYMENT)
        ->and($loser->fresh()->status)->toBe(BookingStatus::BOOKING_RESERVED)
        ->and(Transaction::where('meta->booking_id', $loser->id)->count())->toBe(0)
        ->and((int) $vendor->wallet->fresh()->balance)->toBe(5_000_000);
});

test('payment in progress hold is not expired while the customer completes checkout', function () {
    ['customerA' => $customerA, 'vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule, 'quote' => $quote] = createSingleSeatRaceScenario();

    TourAvailability::where('schedule_id', $schedule->id)->update(['max_pax' => 10, 'available' => 10]);

    $booking = createHeldBooking($customerA, $vendor, $tour, $schedule, $quote, 'BKG-RACE-HOLD');

    mockPrismaLinkBookingCharge();
    $paymentMethod = createPrismaLinkBcaPaymentMethod();

    $this->actingAs($customerA)
        ->postJson("/bookings/{$booking->id}/online-payment", [
            'payment_type' => 'down_payment',
            'amount' => (float) ceil($quote['grand_total'] * 0.3),
            'payment_method_id' => $paymentMethod->id,
        ])
        ->assertOk();

    expect($booking->fresh()->reserved_type)->toBe('payment_in_progress')
        ->and($booking->fresh()->reserved_expires_at)->toBeNull();

    $booking->update(['reserved_expires_at' => now()->subMinute()]);

    app(ExpireBookingReservationsAction::class)->expireIfDue($booking->fresh());

    expect($booking->fresh()->reserved_type)->toBe('payment_in_progress')
        ->and($booking->fresh()->status)->toBe(BookingStatus::BOOKING_RESERVED);
});

test('reconcile overbooked bookings cancels later bookings by paid_at priority', function () {
    ['customerA' => $customerA, 'customerB' => $customerB, 'vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule, 'quote' => $quote] = createSingleSeatRaceScenario();

    $winner = createHeldBooking($customerA, $vendor, $tour, $schedule, $quote, 'BKG-RECON-WIN');
    $loser = createHeldBooking($customerB, $vendor, $tour, $schedule, $quote, 'BKG-RECON-LOSE');

    $winner->update(['status' => BookingStatus::FULL_PAYMENT]);
    $loser->update(['status' => BookingStatus::FULL_PAYMENT]);
    app(SyncAvailabilityAction::class)->executeForBooking($winner->fresh());

    $winner->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $winner->user_id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => $quote['grand_total'],
        'status' => 'paid',
        'paid_at' => now()->subHour(),
        'payload' => ['payment_type' => 'full_payment'],
    ]);
    $loser->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $loser->user_id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => $quote['grand_total'],
        'status' => 'paid',
        'paid_at' => now(),
        'payload' => ['payment_type' => 'full_payment'],
    ]);

    $dryRun = app(ReconcileOverbookedBookingsAction::class)->execute(dryRun: true);
    expect($dryRun)->toHaveCount(1)
        ->and($dryRun[0]['booking_number'])->toBe('BKG-RECON-LOSE')
        ->and($dryRun[0]['action'])->toBe('would_cancel');

    app(ReconcileOverbookedBookingsAction::class)->execute(dryRun: false);

    expect($winner->fresh()->status)->toBe(BookingStatus::FULL_PAYMENT)
        ->and($loser->fresh()->status)->toBe(BookingStatus::CANCELLED);
});
