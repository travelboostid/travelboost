<?php

use App\Actions\Booking\FinalizeBookingPaymentAction;
use App\Enums\BookingStatus;
use App\Enums\CompanyTeamStatus;
use App\Models\AppConfig;
use App\Models\Booking;
use App\Models\BookingDocument;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\PriceCategory;
use App\Models\Tour;
use App\Models\TourAvailability;
use App\Models\TourPrice;
use App\Models\TourSchedule;
use App\Models\Transaction;
use App\Models\User;
use App\Services\BookingPricingService;
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
            'commission_max' => '100000',
        ],
    ]);

    User::factory()->create([
        'name' => 'Travelboost Root',
        'username' => 'root',
        'email' => 'root@travelboost.co.id',
    ]);
});

function createSettlementScenario(bool $withAgent = true, int $vendorBalance = 5_000_000): array
{
    $customer = User::factory()->create();
    $vendor = Company::factory()->create([
        'username' => 'settlementvendor'.fake()->unique()->numberBetween(1000, 9999),
        'type' => 'vendor',
    ]);
    $vendor->companySetting()->updateOrCreate([], [
        'minimum_down_payment' => 30,
        'minimum_vat' => 11,
    ]);

    if ($vendorBalance > 0) {
        $vendor->wallet->deposit($vendorBalance, ['type' => 'test-wallet-topup']);
    }

    $agent = $withAgent
        ? Company::factory()->create([
            'username' => 'settlementagent'.fake()->unique()->numberBetween(1000, 9999),
            'type' => 'agent',
        ])
        : null;

    $tour = Tour::factory()->create([
        'company_id' => $vendor->id,
        'code' => 'SETTLE-TOUR',
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
        'max_pax' => 10,
        'available' => 10,
    ]);

    $adultSingle = PriceCategory::create([
        'company_id' => $vendor->id,
        'name' => 'Adult Single',
        'room_type' => 'single',
    ]);
    $childWithBed = PriceCategory::create([
        'company_id' => $vendor->id,
        'name' => 'Child With Bed',
        'room_type' => 'child_with_bed',
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
    TourPrice::create([
        'company_id' => $vendor->id,
        'tour_code' => $tour->code,
        'schedule_id' => $schedule->id,
        'price_category_id' => $childWithBed->id,
        'currency' => 'IDR',
        'price' => 9_000_000,
        'commission' => 0,
        'commission_rate' => 10,
    ]);

    $passengers = [
        ['first_name' => 'Adult', 'price_category' => 'Adult Single', 'price_amount' => 1],
        ['first_name' => 'Child', 'price_category' => 'Child With Bed', 'price_amount' => 1],
    ];
    $quote = app(BookingPricingService::class)
        ->quoteForBookingData($tour, $schedule->departure_date, $passengers);

    $booking = Booking::factory()->create([
        'user_id' => $customer->id,
        'vendor_id' => $vendor->id,
        'agent_id' => $agent?->id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
        'pax_adult' => 1,
        'pax_child' => 1,
        'pax_infant' => 0,
        'total_price' => $quote['subtotal_guests'],
        'tax_amount' => $quote['tax_amount'],
        'platform_fee' => $quote['platform_fee'],
        'commission_amount' => $withAgent ? $quote['agent_commission'] : 0,
        'grand_total' => $quote['grand_total'],
    ]);
    $booking->passengers()->createMany($quote['passengers']);

    return compact('customer', 'vendor', 'agent', 'tour', 'schedule', 'booking', 'quote');
}

test('down payment does not settle booking wallet transactions', function () {
    ['vendor' => $vendor, 'booking' => $booking] = createSettlementScenario();

    $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 1_000_000,
        'status' => 'paid',
        'payload' => ['payment_type' => 'down_payment'],
    ]);

    app(FinalizeBookingPaymentAction::class)->execute($booking->fresh());

    expect($booking->fresh()->status)->toBe(BookingStatus::DOWN_PAYMENT)
        ->and((int) $vendor->wallet->fresh()->balance)->toBe(5_000_000);

    expect(Transaction::where('meta->booking_id', $booking->id)->count())->toBe(0);
});

test('full payment settles agent commission travelboost commission and platform fee once', function () {
    ['vendor' => $vendor, 'agent' => $agent, 'booking' => $booking, 'quote' => $quote] = createSettlementScenario();
    $root = User::where('username', 'root')->firstOrFail();

    $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => $quote['grand_total'],
        'status' => 'paid',
        'payload' => ['payment_type' => 'full_payment'],
    ]);

    app(FinalizeBookingPaymentAction::class)->execute($booking->fresh());

    $requiredSettlement = 1_900_000 + 125_000 + 60_000;

    expect($booking->fresh()->status)->toBe(BookingStatus::FULL_PAYMENT)
        ->and((float) $booking->fresh()->commission_amount)->toBe(1_900_000.0)
        ->and((float) $booking->fresh()->platform_fee)->toBe(60_000.0)
        ->and((float) $booking->fresh()->grand_total)->toBe((float) $quote['grand_total'])
        ->and((int) $vendor->wallet->fresh()->balance)->toBe(5_000_000 - $requiredSettlement)
        ->and((int) $agent->wallet->fresh()->balance)->toBe(1_900_000)
        ->and((int) $root->wallet->fresh()->balance)->toBe(185_000)
        ->and(Transaction::where('meta->type', 'booking-agent-commission')->where('meta->booking_id', $booking->id)->count())->toBe(2)
        ->and(Transaction::where('meta->type', 'booking-travelboost-commission')->where('meta->booking_id', $booking->id)->count())->toBe(2)
        ->and(Transaction::where('meta->type', 'booking-platform-fee')->where('meta->booking_id', $booking->id)->count())->toBe(2);

    foreach ([
        'booking-agent-commission',
        'booking-travelboost-commission',
        'booking-platform-fee',
    ] as $type) {
        $description = data_get(
            Transaction::query()
                ->where('meta->type', $type)
                ->where('meta->booking_id', $booking->id)
                ->where('amount', '>', 0)
                ->firstOrFail()
                ->meta,
            'description'
        );

        expect($description)
            ->toContain($booking->contact_name)
            ->toContain('2 pax')
            ->toContain($booking->booking_number)
            ->not->toContain('full payment');
    }

    app(FinalizeBookingPaymentAction::class)->execute($booking->fresh());

    expect((int) $vendor->wallet->fresh()->balance)->toBe(5_000_000 - $requiredSettlement)
        ->and((int) $agent->wallet->fresh()->balance)->toBe(1_900_000)
        ->and((int) $root->wallet->fresh()->balance)->toBe(185_000)
        ->and(Transaction::where('meta->booking_id', $booking->id)->count())->toBe(6);
});

test('full payment finalization settles from persisted booking snapshot after tour prices change', function () {
    ['vendor' => $vendor, 'agent' => $agent, 'booking' => $booking, 'quote' => $quote] = createSettlementScenario();
    $root = User::where('username', 'root')->firstOrFail();

    $booking->update([
        'total_price' => $quote['subtotal_guests'],
        'tax_amount' => $quote['tax_amount'],
        'platform_fee' => $quote['platform_fee'],
        'commission_amount' => $quote['agent_commission'],
        'grand_total' => $quote['grand_total'],
    ]);
    $booking->passengers()->delete();
    $booking->passengers()->createMany($quote['passengers']);

    TourPrice::query()
        ->where('tour_code', $booking->tour->code)
        ->update([
            'price' => 30_000_000,
            'promotion' => 5_000_000,
            'commission' => 3_000_000,
            'commission_rate' => 25,
        ]);

    $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => $quote['grand_total'],
        'status' => 'paid',
        'payload' => ['payment_type' => 'full_payment'],
    ]);

    app(FinalizeBookingPaymentAction::class)->execute($booking->fresh());

    $agentTransaction = Transaction::where('meta->type', 'booking-agent-commission')
        ->where('meta->booking_id', $booking->id)
        ->where('amount', 1_900_000)
        ->firstOrFail();
    $travelboostTransaction = Transaction::where('meta->type', 'booking-travelboost-commission')
        ->where('meta->booking_id', $booking->id)
        ->where('amount', 125_000)
        ->firstOrFail();

    expect($booking->fresh()->status)->toBe(BookingStatus::FULL_PAYMENT)
        ->and((float) $booking->fresh()->grand_total)->toBe((float) $quote['grand_total'])
        ->and((float) $booking->fresh()->platform_fee)->toBe((float) $quote['platform_fee'])
        ->and((float) $booking->fresh()->commission_amount)->toBe((float) $quote['agent_commission'])
        ->and((float) $booking->passengers()->where('price_category', 'Adult Single')->firstOrFail()->price_amount)->toBe(12_000_000.0)
        ->and((int) $vendor->wallet->fresh()->balance)->toBe(5_000_000 - 1_900_000 - 125_000 - 60_000)
        ->and((int) $agent->wallet->fresh()->balance)->toBe(1_900_000)
        ->and((int) $root->wallet->fresh()->balance)->toBe(185_000)
        ->and(data_get($agentTransaction->meta, 'breakdown.source'))->toBe('booking_snapshot')
        ->and(data_get($travelboostTransaction->meta, 'breakdown.source'))->toBe('booking_snapshot');
});

test('direct vendor full payment skips agent commission settlement', function () {
    ['vendor' => $vendor, 'booking' => $booking, 'quote' => $quote] = createSettlementScenario(withAgent: false);
    $root = User::where('username', 'root')->firstOrFail();

    $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => $quote['grand_total'],
        'status' => 'paid',
        'payload' => ['payment_type' => 'full_payment'],
    ]);

    app(FinalizeBookingPaymentAction::class)->execute($booking->fresh());

    expect($booking->fresh()->status)->toBe(BookingStatus::FULL_PAYMENT)
        ->and((float) $booking->fresh()->commission_amount)->toBe(0.0)
        ->and((int) $vendor->wallet->fresh()->balance)->toBe(5_000_000 - 185_000)
        ->and((int) $root->wallet->fresh()->balance)->toBe(185_000)
        ->and(Transaction::where('meta->type', 'booking-agent-commission')->where('meta->booking_id', $booking->id)->exists())->toBeFalse();
});

test('insufficient vendor wallet blocks full payment finalization', function () {
    ['vendor' => $vendor, 'booking' => $booking, 'quote' => $quote] = createSettlementScenario(vendorBalance: 100_000);

    $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => $quote['grand_total'],
        'status' => 'paid',
        'payload' => ['payment_type' => 'full_payment'],
    ]);

    expect(fn () => app(FinalizeBookingPaymentAction::class)->execute($booking->fresh()))
        ->toThrow(ValidationException::class);

    expect($booking->fresh()->status)->toBe(BookingStatus::WAITING_PAYMENT_APPROVAL)
        ->and((int) $vendor->wallet->fresh()->balance)->toBe(100_000)
        ->and(Transaction::where('meta->booking_id', $booking->id)->count())->toBe(0);
});

test('manual full payment approval is blocked when vendor wallet cannot settle commissions', function () {
    ['customer' => $customer, 'vendor' => $vendor, 'booking' => $booking, 'quote' => $quote] = createSettlementScenario(vendorBalance: 100_000);
    $vendorUser = User::factory()->create();
    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $vendorUser->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $payment = $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $customer->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => $quote['grand_total'],
        'status' => 'pending',
        'payload' => ['payment_type' => 'full_payment'],
    ]);

    $response = $this->actingAs($vendorUser)
        ->from("/companies/{$vendor->username}/dashboard/bookings")
        ->post("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/manual-payments/{$payment->id}/accept");

    $response->assertSessionHasErrors('wallet');

    expect($payment->fresh()->status->value)->toBe('pending')
        ->and($booking->fresh()->status)->toBe(BookingStatus::WAITING_PAYMENT_APPROVAL)
        ->and((int) $vendor->wallet->fresh()->balance)->toBe(100_000);
});

test('midtrans webhook full payment is blocked when vendor wallet cannot settle commissions', function () {
    ['customer' => $customer, 'vendor' => $vendor, 'booking' => $booking, 'quote' => $quote] = createSettlementScenario(vendorBalance: 100_000);

    $payment = $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $customer->id,
        'provider' => 'midtrans',
        'payment_method' => 'snap',
        'amount' => $quote['grand_total'],
        'status' => 'pending',
        'payload' => ['payment_type' => 'full_payment'],
    ]);

    $response = $this->postJson('/webhooks/midtrans/notification', [
        'order_id' => $payment->id.'-blocked-settlement',
        'transaction_status' => 'settlement',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors('wallet');

    expect($payment->fresh()->status->value)->toBe('pending')
        ->and($booking->fresh()->status)->toBe(BookingStatus::WAITING_PAYMENT_APPROVAL)
        ->and((int) $vendor->wallet->fresh()->balance)->toBe(100_000);
});

test('customer manual full payment is blocked before proof is stored when vendor wallet cannot settle commissions', function () {
    Storage::fake('public');

    ['customer' => $customer, 'vendor' => $vendor, 'booking' => $booking, 'quote' => $quote] = createSettlementScenario(vendorBalance: 100_000);

    $booking->update([
        'status' => BookingStatus::BOOKING_RESERVED,
    ]);

    $response = $this->actingAs($customer)
        ->from("/bookings/{$booking->id}/manual-payment")
        ->post("/bookings/{$booking->id}/manual-payment", [
            'sender_bank_name' => 'BCA',
            'sender_account_number' => '1234567890',
            'transfer_amount' => $quote['grand_total'],
            'payment_type' => 'full_payment',
            'proof' => UploadedFile::fake()->image('proof.jpg'),
        ]);

    $response->assertSessionHasErrors('payment');

    expect($booking->fresh()->status)->toBe(BookingStatus::BOOKING_RESERVED)
        ->and($booking->payments()->count())->toBe(0)
        ->and(BookingDocument::query()->where('booking_id', $booking->id)->count())->toBe(0)
        ->and(Storage::disk('public')->allFiles('payment-proofs'))->toBe([])
        ->and((int) $vendor->wallet->fresh()->balance)->toBe(100_000);
});

test('customer online full payment is blocked before snap payment is created when vendor wallet cannot settle commissions', function () {
    ['customer' => $customer, 'vendor' => $vendor, 'booking' => $booking, 'quote' => $quote] = createSettlementScenario(vendorBalance: 100_000);

    Mockery::mock('alias:Midtrans\Snap')
        ->shouldReceive('getSnapToken')
        ->andReturn('blocked-token');

    $booking->update([
        'status' => BookingStatus::BOOKING_RESERVED,
    ]);

    $response = $this->actingAs($customer)
        ->postJson("/bookings/{$booking->id}/online-payment", [
            'payment_type' => 'full_payment',
            'amount' => $quote['grand_total'],
        ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors('payment');

    expect($booking->fresh()->status)->toBe(BookingStatus::BOOKING_RESERVED)
        ->and($booking->payments()->count())->toBe(0)
        ->and((int) $vendor->wallet->fresh()->balance)->toBe(100_000);
});

test('customer online down payment remains available when vendor wallet cannot settle full payment commissions', function () {
    ['customer' => $customer, 'vendor' => $vendor, 'booking' => $booking] = createSettlementScenario(vendorBalance: 100_000);

    Mockery::mock('alias:Midtrans\Snap')
        ->shouldReceive('getSnapToken')
        ->once()
        ->andReturn('down-payment-token');

    $booking->update([
        'status' => BookingStatus::BOOKING_RESERVED,
    ]);

    $response = $this->actingAs($customer)
        ->postJson("/bookings/{$booking->id}/online-payment", [
            'payment_type' => 'down_payment',
            'amount' => 1_000_000,
        ]);

    $response->assertOk()
        ->assertJsonPath('payment.payload.snap_token', 'down-payment-token');

    expect($booking->payments()->count())->toBe(1)
        ->and($booking->fresh()->status)->toBe(BookingStatus::BOOKING_RESERVED)
        ->and((int) $vendor->wallet->fresh()->balance)->toBe(100_000);
});

test('customer online payment returns validation error when midtrans snap token request fails', function () {
    ['customer' => $customer, 'booking' => $booking] = createSettlementScenario(vendorBalance: 100_000);

    Mockery::mock('alias:Midtrans\Snap')
        ->shouldReceive('getSnapToken')
        ->once()
        ->andThrow(new RuntimeException('CURL Error: Failed to connect to app.sandbox.midtrans.com'));

    $booking->update([
        'status' => BookingStatus::BOOKING_RESERVED,
    ]);

    $response = $this->actingAs($customer)
        ->postJson("/bookings/{$booking->id}/online-payment", [
            'payment_type' => 'down_payment',
            'amount' => 1_000_000,
        ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors('payment');

    expect($booking->payments()->count())->toBe(0)
        ->and($booking->fresh()->status)->toBe(BookingStatus::BOOKING_RESERVED);
});

test('customer can submit manual payment after online provider is unavailable', function () {
    Storage::fake('public');

    ['customer' => $customer, 'booking' => $booking] = createSettlementScenario(vendorBalance: 100_000);

    Mockery::mock('alias:Midtrans\Snap')
        ->shouldReceive('getSnapToken')
        ->once()
        ->andThrow(new RuntimeException('CURL Error: Failed to connect to app.sandbox.midtrans.com'));

    $booking->update([
        'status' => BookingStatus::BOOKING_RESERVED,
    ]);

    $onlineResponse = $this->actingAs($customer)
        ->postJson("/bookings/{$booking->id}/online-payment", [
            'payment_type' => 'down_payment',
            'amount' => 1_000_000,
        ]);

    $onlineResponse->assertUnprocessable()
        ->assertJsonValidationErrors('payment');

    expect($booking->payments()->count())->toBe(0)
        ->and($booking->fresh()->status)->toBe(BookingStatus::BOOKING_RESERVED);

    $manualResponse = $this->actingAs($customer)
        ->post("/bookings/{$booking->id}/manual-payment", [
            'sender_bank_name' => 'BCA',
            'sender_account_number' => '1234567890',
            'transfer_amount' => 1_000_000,
            'payment_type' => 'down_payment',
            'proof' => UploadedFile::fake()->image('proof.jpg'),
        ]);

    $manualResponse->assertRedirect()
        ->assertSessionHas('bookingPaymentResult.bookingStatus', 'waiting payment approval');

    expect($booking->payments()->count())->toBe(1)
        ->and($booking->fresh()->status)->toBe(BookingStatus::WAITING_PAYMENT_APPROVAL);
});

test('customer down payment remains available when vendor wallet cannot settle full payment commissions', function () {
    Storage::fake('public');

    ['customer' => $customer, 'booking' => $booking] = createSettlementScenario(vendorBalance: 100_000);

    $booking->update([
        'status' => BookingStatus::BOOKING_RESERVED,
    ]);

    $response = $this->actingAs($customer)
        ->post("/bookings/{$booking->id}/manual-payment", [
            'sender_bank_name' => 'BCA',
            'sender_account_number' => '1234567890',
            'transfer_amount' => 1_000_000,
            'payment_type' => 'down_payment',
            'proof' => UploadedFile::fake()->image('proof.jpg'),
        ]);

    $response->assertRedirect()
        ->assertSessionHas('bookingPaymentResult.bookingStatus', 'waiting payment approval');

    expect($booking->payments()->count())->toBe(1)
        ->and($booking->fresh()->status)->toBe(BookingStatus::WAITING_PAYMENT_APPROVAL);
});

test('customer balance payment is blocked when it would finalize full payment without enough vendor wallet', function () {
    ['customer' => $customer, 'vendor' => $vendor, 'booking' => $booking, 'quote' => $quote] = createSettlementScenario(vendorBalance: 100_000);

    $booking->update([
        'status' => BookingStatus::DOWN_PAYMENT,
    ]);
    $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $customer->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 1_000_000,
        'status' => 'paid',
        'payload' => ['payment_type' => 'down_payment'],
    ]);

    Mockery::mock('alias:Midtrans\Snap')
        ->shouldReceive('getSnapToken')
        ->andReturn('blocked-token');

    $response = $this->actingAs($customer)
        ->postJson("/bookings/{$booking->id}/online-payment", [
            'payment_type' => 'full_payment',
            'amount' => $quote['grand_total'] - 1_000_000,
        ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors('payment');

    expect($booking->fresh()->status)->toBe(BookingStatus::DOWN_PAYMENT)
        ->and($booking->payments()->count())->toBe(1)
        ->and((int) $vendor->wallet->fresh()->balance)->toBe(100_000);
});
