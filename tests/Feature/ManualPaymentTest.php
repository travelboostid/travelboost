<?php

use App\Enums\BookingStatus;
use App\Enums\CompanyTeamStatus;
use App\Enums\VendorAgentPartnerStatus;
use App\Models\Booking;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Domain;
use App\Models\Tour;
use App\Models\TourAvailability;
use App\Models\TourSchedule;
use App\Models\User;
use App\Models\VendorAgentPartner;
use Database\Seeders\Common\RolePermissionSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);
    Booking::unsetEventDispatcher();
    DB::table('continents')->insertOrIgnore(['id' => 1, 'name' => 'Asia']);
    DB::table('regions')->insertOrIgnore(['id' => 1, 'name' => 'Southeast Asia', 'continent_id' => 1]);
    DB::table('countries')->insertOrIgnore(['id' => 1, 'name' => 'Indonesia', 'continent_id' => 1, 'region_id' => 1]);
});

test('customer can submit a manual payment proof for a booking', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $vendor->companySetting()->updateOrCreate([], [
        'minimum_down_payment' => 30,
    ]);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'reserved',
        'grand_total' => 1_000_000,
    ]);

    $response = $this->actingAs($user)->post("/bookings/{$booking->id}/manual-payment", [
        'sender_bank_name' => 'BCA',
        'sender_account_number' => '1234567890',
        'transfer_amount' => 500_000,
        'payment_type' => 'down_payment',
        'payment_date' => '2026-05-01',
        'proof' => UploadedFile::fake()->image('proof.jpg'),
    ]);

    $response->assertRedirect()
        ->assertSessionHas('bookingPaymentResult.bookingStatus', 'waiting payment approval')
        ->assertSessionHas('bookingPaymentResult.paymentStatus', 'pending')
        ->assertSessionHas('bookingPaymentResult.paymentMode', 'manual')
        ->assertSessionHas('bookingPaymentResult.bookingNumber', $booking->booking_number)
        ->assertSessionHas('bookingPaymentResult.tourName', $tour->name)
        ->assertSessionHas('bookingPaymentResult.paidAmount', 0.0)
        ->assertSessionHas('bookingPaymentResult.remainingBalance', 1_000_000.0);

    $this->assertDatabaseHas('payments', [
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 500_000,
        'status' => 'pending',
    ]);

    $this->assertDatabaseHas('booking_documents', [
        'booking_id' => $booking->id,
        'type' => 'payment_proof',
        'file_name' => 'proof.jpg',
    ]);

    $manualPayment = $booking->fresh()->payments()->latest()->first();

    expect($booking->fresh()->status->value)->toBe('waiting payment approval');
    expect($booking->fresh()->payment_mode)->toBe('manual');
    expect($manualPayment->payload)->toMatchArray([
        'payment_type' => 'down_payment',
        'payment_date' => '2026-05-01',
        'payment_receiver_type' => 'vendor',
        'payment_receiver_company_id' => $vendor->id,
        'partnership_payment_mode' => 'vendor',
    ]);
});

test('customer cannot submit down payment proof when vendor minimum down payment is not configured', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $vendor->companySetting()->updateOrCreate([], [
        'minimum_down_payment' => 0,
    ]);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'reserved',
        'grand_total' => 1_000_000,
    ]);

    $response = $this->actingAs($user)
        ->from("/bookings/{$booking->id}/manual-payment")
        ->post("/bookings/{$booking->id}/manual-payment", [
            'sender_bank_name' => 'BCA',
            'sender_account_number' => '1234567890',
            'transfer_amount' => 500_000,
            'payment_type' => 'down_payment',
            'payment_date' => '2026-05-01',
            'proof' => UploadedFile::fake()->image('proof.jpg'),
        ]);

    $response->assertSessionHasErrors('payment_type');

    expect($booking->payments()->count())->toBe(0)
        ->and(Storage::disk('public')->allFiles('payment-proofs'))->toBe([]);
});

test('agent payment mode records agent receiver context on manual payment proof', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $vendor = Company::factory()->create([
        'username' => 'proofmodevendor',
        'type' => 'vendor',
    ]);
    $vendor->companySetting()->updateOrCreate([], [
        'minimum_down_payment' => 30,
    ]);
    $agent = Company::factory()->create([
        'username' => 'proofmodeagent',
        'type' => 'agent',
    ]);
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
        'status' => 'reserved',
        'grand_total' => 1_000_000,
    ]);

    $this->actingAs($user)->post("/bookings/{$booking->id}/manual-payment", [
        'sender_bank_name' => 'BCA',
        'sender_account_number' => '1234567890',
        'transfer_amount' => 500_000,
        'payment_type' => 'down_payment',
        'payment_date' => '2026-05-01',
        'proof' => UploadedFile::fake()->image('proof.jpg'),
    ])->assertRedirect();

    $manualPayment = $booking->fresh()->payments()->latest()->first();

    expect($manualPayment->payload)->toMatchArray([
        'payment_type' => 'down_payment',
        'payment_receiver_type' => 'agent',
        'payment_receiver_company_id' => $agent->id,
        'partnership_payment_mode' => 'agent',
    ]);
});

test('manual payment proof requires payment type', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $vendor->companySetting()->updateOrCreate([], [
        'minimum_down_payment' => 30,
    ]);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'booking reserved',
        'grand_total' => 1_000_000,
    ]);

    $response = $this->actingAs($user)
        ->from("/bookings/{$booking->id}/manual-payment")
        ->post("/bookings/{$booking->id}/manual-payment", [
            'sender_bank_name' => 'BCA',
            'sender_account_number' => '1234567890',
            'transfer_amount' => 500_000,
            'proof' => UploadedFile::fake()->image('proof.jpg'),
        ]);

    $response->assertSessionHasErrors('payment_type');
    expect($booking->payments()->count())->toBe(0);
});

test('manual payment proof requires payment date', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $vendor->companySetting()->updateOrCreate([], [
        'minimum_down_payment' => 30,
    ]);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'booking reserved',
        'grand_total' => 1_000_000,
    ]);

    $response = $this->actingAs($user)
        ->from("/bookings/{$booking->id}/manual-payment")
        ->post("/bookings/{$booking->id}/manual-payment", [
            'sender_bank_name' => 'BCA',
            'sender_account_number' => '1234567890',
            'transfer_amount' => 500_000,
            'payment_type' => 'down_payment',
            'proof' => UploadedFile::fake()->image('proof.jpg'),
        ]);

    $response->assertSessionHasErrors('payment_date');
    expect($booking->payments()->count())->toBe(0);
});

test('customer cannot submit manual payment after booking reservation expired', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::BOOKING_RESERVED,
        'reserved_type' => 'system',
        'reserved_expires_at' => now()->subMinute(),
        'grand_total' => 1_000_000,
    ]);

    $response = $this->actingAs($user)
        ->from("/bookings/{$booking->id}/manual-payment")
        ->post("/bookings/{$booking->id}/manual-payment", [
            'sender_bank_name' => 'BCA',
            'sender_account_number' => '1234567890',
            'transfer_amount' => 500_000,
            'payment_type' => 'down_payment',
            'proof' => UploadedFile::fake()->image('proof.jpg'),
        ]);

    $response->assertSessionHasErrors('booking');

    expect($booking->fresh()->status)->toBe(BookingStatus::EXPIRED)
        ->and($booking->payments()->count())->toBe(0);
});

test('customer cannot submit manual payment for another users booking', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'user_id' => $owner->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
    ]);

    $this->actingAs($otherUser)->post("/bookings/{$booking->id}/manual-payment", [
        'sender_bank_name' => 'BCA',
        'sender_account_number' => '1234567890',
        'transfer_amount' => 500_000,
        'proof' => UploadedFile::fake()->image('proof.jpg'),
    ])->assertForbidden();
});

test('manual payment sender account number must contain digits only', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'reserved',
    ]);

    $response = $this->actingAs($user)
        ->from("/bookings/{$booking->id}/manual-payment")
        ->post("/bookings/{$booking->id}/manual-payment", [
            'sender_bank_name' => 'BCA',
            'sender_account_number' => 'ABC123',
            'transfer_amount' => 500_000,
            'proof' => UploadedFile::fake()->image('proof.jpg'),
        ]);

    $response->assertSessionHasErrors('sender_account_number');
});

test('customer can create an online booking payment with midtrans snap token', function () {
    $user = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $vendor->companySetting()->updateOrCreate([], [
        'minimum_down_payment' => 30,
    ]);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'reserved',
        'grand_total' => 1_000_000,
    ]);

    Mockery::mock('alias:Midtrans\Snap')
        ->shouldReceive('getSnapToken')
        ->once()
        ->andReturn('booking-snap-token');

    $response = $this->actingAs($user)->postJson("/bookings/{$booking->id}/online-payment", [
        'payment_type' => 'down_payment',
        'amount' => 200_000,
    ]);

    $response->assertOk()
        ->assertJsonPath('payment.payload.snap_token', 'booking-snap-token')
        ->assertJsonPath('payment.payload.payment_type', 'down_payment');

    $this->assertDatabaseHas('payments', [
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'midtrans',
        'payment_method' => 'snap',
        'amount' => 200_000,
        'status' => 'pending',
    ]);

    expect($booking->fresh()->payment_mode)->toBe('online');
});

test('dashboard online full payment keeps down payment booking status until midtrans confirms', function () {
    $user = User::factory()->create();
    $vendorUser = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $vendorUser->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::DOWN_PAYMENT,
        'payment_mode' => 'online',
        'grand_total' => 1_000_000,
        'total_price' => 1_000_000,
        'tax_amount' => 0,
        'platform_fee' => 0,
        'commission_amount' => 0,
    ]);
    $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'provider' => 'midtrans',
        'payment_method' => 'snap',
        'amount' => 250_000,
        'status' => 'paid',
        'payload' => ['payment_type' => 'down_payment'],
        'paid_at' => now()->subDay(),
    ]);

    Mockery::mock('alias:Midtrans\Snap')
        ->shouldReceive('getSnapToken')
        ->once()
        ->andReturn('dashboard-balance-token');

    $response = $this->actingAs($vendorUser)
        ->postJson("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/online-payment", [
            'payment_type' => 'full_payment',
            'amount' => 750_000,
        ]);

    $response->assertOk()
        ->assertJsonPath('payment.payload.snap_token', 'dashboard-balance-token')
        ->assertJsonPath('payment.payload.payment_type', 'full_payment')
        ->assertJsonPath('bookingPaymentResult.bookingStatus', 'down payment')
        ->assertJsonPath('bookingPaymentResult.paymentStatus', 'pending');

    expect($booking->fresh()->status)->toBe(BookingStatus::DOWN_PAYMENT)
        ->and($booking->fresh()->payment_mode)->toBe('online');
});

test('customer online full payment keeps down payment booking status until midtrans confirms', function () {
    $user = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::DOWN_PAYMENT,
        'payment_mode' => 'online',
        'grand_total' => 1_000_000,
        'total_price' => 1_000_000,
        'tax_amount' => 0,
        'platform_fee' => 0,
        'commission_amount' => 0,
    ]);
    $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'provider' => 'midtrans',
        'payment_method' => 'snap',
        'amount' => 250_000,
        'status' => 'paid',
        'payload' => ['payment_type' => 'down_payment'],
        'paid_at' => now()->subDay(),
    ]);

    Mockery::mock('alias:Midtrans\Snap')
        ->shouldReceive('getSnapToken')
        ->once()
        ->andReturn('customer-balance-token');

    $response = $this->actingAs($user)->postJson("/bookings/{$booking->id}/online-payment", [
        'payment_type' => 'full_payment',
        'amount' => 750_000,
    ]);

    $response->assertOk()
        ->assertJsonPath('payment.payload.snap_token', 'customer-balance-token')
        ->assertJsonPath('payment.payload.payment_type', 'full_payment')
        ->assertJsonPath('bookingPaymentResult.bookingStatus', 'down payment')
        ->assertJsonPath('bookingPaymentResult.paymentStatus', 'pending');

    expect($booking->fresh()->status)->toBe(BookingStatus::DOWN_PAYMENT)
        ->and($booking->fresh()->payment_mode)->toBe('online');
});

test('customer cannot create online payment after booking reservation expired', function () {
    $user = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::BOOKING_RESERVED,
        'reserved_type' => 'system',
        'reserved_expires_at' => now()->subMinute(),
        'grand_total' => 1_000_000,
    ]);

    $response = $this->actingAs($user)->postJson("/bookings/{$booking->id}/online-payment", [
        'payment_type' => 'down_payment',
        'amount' => 200_000,
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors('booking');

    expect($booking->fresh()->status)->toBe(BookingStatus::EXPIRED)
        ->and($booking->payments()->count())->toBe(0);
});

test('midtrans webhook marks online booking payment as paid and updates booking status', function () {
    $user = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'awaiting payment',
        'payment_mode' => 'online',
        'grand_total' => 1_000_000,
    ]);

    $payment = $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'provider' => 'midtrans',
        'payment_method' => 'snap',
        'amount' => 200_000,
        'status' => 'pending',
        'payload' => [
            'payment_type' => 'down_payment',
        ],
    ]);

    $response = $this->postJson('/webhooks/midtrans/notification', [
        'order_id' => $payment->id.'-booking',
        'transaction_status' => 'settlement',
    ]);

    $response->assertOk();

    expect($booking->fresh()->status->value)->toBe('down payment');
    expect($booking->fresh()->payment_mode)->toBe('online');
    expect($payment->fresh()->status->value)->toBe('paid');
    expect(data_get($payment->fresh()->payload, 'payment_type'))->toBe('down_payment');
});

test('customer can confirm successful midtrans booking payment after hold expiry and update booking status', function () {
    $user = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::BOOKING_RESERVED,
        'payment_mode' => 'online',
        'grand_total' => 1_000_000,
        'reserved_type' => 'system',
        'reserved_expires_at' => now()->subMinute(),
    ]);

    $payment = $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'provider' => 'midtrans',
        'payment_method' => 'snap',
        'amount' => 1_000_000,
        'status' => 'pending',
        'payload' => [
            'payment_type' => 'full_payment',
            'order_id' => 'booking-order-123',
            'request' => [
                'transaction_details' => [
                    'order_id' => 'booking-order-123',
                ],
            ],
        ],
    ]);

    Mockery::mock('alias:Midtrans\Transaction')
        ->shouldReceive('status')
        ->once()
        ->with('booking-order-123')
        ->andReturn((object) [
            'order_id' => 'booking-order-123',
            'transaction_status' => 'settlement',
        ]);

    $response = $this->actingAs($user)
        ->postJson("/bookings/{$booking->id}/online-payment/{$payment->id}/confirm");

    $response->assertOk()
        ->assertJsonPath('booking.status', 'full payment')
        ->assertJsonPath('payment.status', 'paid')
        ->assertJsonPath('bookingPaymentResult.bookingStatus', 'full payment')
        ->assertJsonPath('bookingPaymentResult.paymentStatus', 'paid')
        ->assertJsonPath('bookingPaymentResult.paymentMode', 'online')
        ->assertJsonPath('bookingPaymentResult.bookingNumber', $booking->booking_number)
        ->assertJsonPath('bookingPaymentResult.tourName', $tour->name)
        ->assertJsonPath('bookingPaymentResult.paidAmount', 1_000_000)
        ->assertJsonPath('bookingPaymentResult.remainingBalance', 0);

    expect($booking->fresh()->status->value)->toBe('full payment');
    expect($payment->fresh()->status->value)->toBe('paid');
    expect(data_get($payment->fresh()->payload, 'payment_type'))->toBe('full_payment');
});

test('vendor can approve pending manual payment proof and move booking to selected payment status', function () {
    $user = User::factory()->create();
    $vendorUser = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $vendorUser->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
        'payment_mode' => 'manual',
        'grand_total' => 1_000_000,
    ]);

    $payment = $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 200_000,
        'status' => 'pending',
        'payload' => [
            'payment_type' => 'down_payment',
            'payment_date' => '2026-05-03',
            'sender_bank' => 'BCA',
            'sender_account' => '1234567890',
        ],
    ]);

    $response = $this->actingAs($vendorUser)
        ->post("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/manual-payments/{$payment->id}/accept");

    $response->assertRedirect();

    expect($booking->fresh()->status->value)->toBe('down payment');
    expect($payment->fresh()->status->value)->toBe('paid');
    expect($payment->fresh()->paid_at?->toDateString())->toBe('2026-05-03');
});

test('manual payment approval uses verified paid total instead of payload status', function () {
    $user = User::factory()->create();
    $vendorUser = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $vendorUser->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
        'payment_mode' => 'manual',
        'grand_total' => 1_000_000,
    ]);

    $payment = $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 400_000,
        'status' => 'pending',
        'payload' => [
            'payment_type' => 'full_payment',
            'sender_bank' => 'BCA',
            'sender_account' => '1234567890',
        ],
    ]);

    $response = $this->actingAs($vendorUser)
        ->post("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/manual-payments/{$payment->id}/accept");

    $response->assertRedirect();

    expect($booking->fresh()->status->value)->toBe('down payment');
    expect($payment->fresh()->status->value)->toBe('paid');
});

test('vendor payment mode lets only vendor review manual transfer proof', function () {
    $user = User::factory()->create();
    $vendorUser = User::factory()->create();
    $agentUser = User::factory()->create();
    $vendor = Company::factory()->create([
        'username' => 'manualmodevendor',
        'type' => 'vendor',
    ]);
    $agent = Company::factory()->create([
        'username' => 'manualmodeagent',
        'type' => 'agent',
    ]);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $vendorUser->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);
    CompanyTeam::create([
        'company_id' => $agent->id,
        'user_id' => $agentUser->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);
    VendorAgentPartner::create([
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'status' => VendorAgentPartnerStatus::ACTIVE,
        'accepted_at' => now(),
        'payment_mode' => 'vendor',
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
        'payment_mode' => 'manual',
        'grand_total' => 1_000_000,
    ]);

    $payment = $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 200_000,
        'status' => 'pending',
        'payload' => ['payment_type' => 'down_payment'],
    ]);

    $this->actingAs($agentUser)
        ->post("/companies/{$agent->username}/dashboard/bookings/{$booking->id}/manual-payments/{$payment->id}/decline")
        ->assertForbidden();

    $this->actingAs($vendorUser)
        ->post("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/manual-payments/{$payment->id}/accept")
        ->assertRedirect();

    expect($booking->fresh()->status->value)->toBe('down payment');
    expect($payment->fresh()->status->value)->toBe('paid');
});

test('agent payment mode lets only agent review manual transfer proof', function () {
    $user = User::factory()->create();
    $vendorUser = User::factory()->create();
    $agentUser = User::factory()->create();
    $vendor = Company::factory()->create([
        'username' => 'agentmanualmodevendor',
        'type' => 'vendor',
    ]);
    $agent = Company::factory()->create([
        'username' => 'agentmanualmodeagent',
        'type' => 'agent',
    ]);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $vendorUser->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);
    CompanyTeam::create([
        'company_id' => $agent->id,
        'user_id' => $agentUser->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);
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
        'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
        'payment_mode' => 'manual',
        'grand_total' => 1_000_000,
    ]);

    $payment = $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 1_000_000,
        'status' => 'pending',
        'payload' => ['payment_type' => 'full_payment'],
    ]);

    $this->actingAs($vendorUser)
        ->post("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/manual-payments/{$payment->id}/decline")
        ->assertForbidden();

    $this->actingAs($agentUser)
        ->post("/companies/{$agent->username}/dashboard/bookings/{$booking->id}/manual-payments/{$payment->id}/accept")
        ->assertRedirect();

    expect($booking->fresh()->status->value)->toBe('full payment');
    expect($payment->fresh()->status->value)->toBe('paid');
});

test('booking create refresh exposes approved manual down payment result', function () {
    $user = User::factory()->create();
    $vendorUser = User::factory()->create();
    $vendor = Company::factory()->create([
        'username' => 'manualdpvendor',
        'type' => 'vendor',
    ]);
    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $vendorUser->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);
    Domain::create([
        'subdomain' => $vendor->username,
        'owner_type' => Company::class,
        'owner_id' => $vendor->id,
        'domain_enabled' => true,
        'subdomain_enabled' => true,
    ]);

    $tour = Tour::factory()->create([
        'company_id' => $vendor->id,
        'status' => 'active',
    ]);
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
        'departure_date' => $schedule->departure_date,
        'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
        'payment_mode' => 'manual',
        'grand_total' => 1_000_000,
    ]);
    $payment = $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 250_000,
        'status' => 'pending',
        'payload' => ['payment_type' => 'down_payment'],
    ]);

    $this->actingAs($vendorUser)
        ->post("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/manual-payments/{$payment->id}/accept")
        ->assertRedirect();

    $response = $this->actingAs($user)->get(route('bookings.create', [
        'username' => $vendor->username,
        'tour' => $tour,
        'date' => $schedule->departure_date,
        'booking_number' => $booking->booking_number,
    ]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tours/bookings/create')
        ->where('bookingPaymentResult.bookingStatus', 'down payment')
        ->where('bookingPaymentResult.paymentStatus', 'paid')
        ->where('bookingPaymentResult.paymentMode', 'manual')
        ->where('bookingPaymentResult.paidAmount', 250000)
        ->where('bookingPaymentResult.remainingBalance', 750000));

    $this->actingAs($user)
        ->getJson("/bookings/{$booking->id}/payment-result")
        ->assertOk()
        ->assertJsonPath('bookingPaymentResult.bookingStatus', 'down payment')
        ->assertJsonPath('bookingPaymentResult.paymentStatus', 'paid')
        ->assertJsonPath('bookingPaymentResult.paymentMode', 'manual')
        ->assertJsonPath('bookingPaymentResult.paidAmount', 250000)
        ->assertJsonPath('bookingPaymentResult.remainingBalance', 750000);

    $appHost = env('APP_HOST', 'localhost');
    $this->actingAs($user)
        ->getJson("http://{$vendor->username}.{$appHost}/bookings/{$booking->id}/payment-result")
        ->assertOk()
        ->assertJsonPath('bookingPaymentResult.bookingStatus', 'down payment')
        ->assertJsonPath('bookingPaymentResult.paymentStatus', 'paid');
});

test('booking create refresh exposes approved manual full payment result', function () {
    $user = User::factory()->create();
    $vendorUser = User::factory()->create();
    $vendor = Company::factory()->create([
        'username' => 'manualfpvendor',
        'type' => 'vendor',
    ]);
    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $vendorUser->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);
    Domain::create([
        'subdomain' => $vendor->username,
        'owner_type' => Company::class,
        'owner_id' => $vendor->id,
        'domain_enabled' => true,
        'subdomain_enabled' => true,
    ]);

    $tour = Tour::factory()->create([
        'company_id' => $vendor->id,
        'status' => 'active',
    ]);
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
        'departure_date' => $schedule->departure_date,
        'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
        'payment_mode' => 'manual',
        'grand_total' => 1_000_000,
    ]);
    $payment = $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 1_000_000,
        'status' => 'pending',
        'payload' => ['payment_type' => 'full_payment'],
    ]);

    $this->actingAs($vendorUser)
        ->post("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/manual-payments/{$payment->id}/accept")
        ->assertRedirect();

    $response = $this->actingAs($user)->get(route('bookings.create', [
        'username' => $vendor->username,
        'tour' => $tour,
        'date' => $schedule->departure_date,
        'booking_number' => $booking->booking_number,
    ]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tours/bookings/create')
        ->where('bookingPaymentResult.bookingStatus', 'full payment')
        ->where('bookingPaymentResult.paymentStatus', 'paid')
        ->where('bookingPaymentResult.paymentMode', 'manual')
        ->where('bookingPaymentResult.paidAmount', 1000000)
        ->where('bookingPaymentResult.remainingBalance', 0));

    $this->actingAs($user)
        ->getJson("/bookings/{$booking->id}/payment-result")
        ->assertOk()
        ->assertJsonPath('bookingPaymentResult.bookingStatus', 'full payment')
        ->assertJsonPath('bookingPaymentResult.paymentStatus', 'paid')
        ->assertJsonPath('bookingPaymentResult.paymentMode', 'manual')
        ->assertJsonPath('bookingPaymentResult.paidAmount', 1000000)
        ->assertJsonPath('bookingPaymentResult.remainingBalance', 0);
});

test('another customer cannot read a booking payment result', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::DOWN_PAYMENT,
        'payment_mode' => 'manual',
        'grand_total' => 1_000_000,
    ]);

    $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 250_000,
        'status' => 'paid',
        'payload' => ['payment_type' => 'down_payment'],
    ]);

    $this->actingAs($otherUser)
        ->getJson("/bookings/{$booking->id}/payment-result")
        ->assertForbidden();
});

test('vendor can decline pending manual payment proof and cancel booking', function () {
    $user = User::factory()->create();
    $vendorUser = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $vendorUser->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
        'payment_mode' => 'manual',
    ]);

    $payment = $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 200_000,
        'status' => 'pending',
        'payload' => [
            'payment_type' => 'full_payment',
            'sender_bank' => 'BCA',
            'sender_account' => '1234567890',
        ],
    ]);

    $response = $this->actingAs($vendorUser)
        ->post("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/manual-payments/{$payment->id}/decline");

    $response->assertRedirect();

    expect($booking->fresh()->status->value)->toBe('cancelled');
    expect($payment->fresh()->status->value)->toBe('failed');
});
