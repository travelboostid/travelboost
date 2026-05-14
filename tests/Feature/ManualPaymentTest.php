<?php

use App\Enums\BookingStatus;
use App\Enums\CompanyTeamStatus;
use App\Models\Booking;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Domain;
use App\Models\Tour;
use App\Models\TourAvailability;
use App\Models\TourSchedule;
use App\Models\User;
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

    expect($booking->fresh()->status->value)->toBe('waiting payment approval');
    expect($booking->fresh()->payment_mode)->toBe('manual');
    expect($booking->fresh()->payments()->latest()->first()->payload['payment_type'])->toBe('down_payment');
});

test('manual payment proof requires payment type', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
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
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'reserved',
        'grand_total' => 1_000_000,
    ]);

    \Mockery::mock('alias:Midtrans\Snap')
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

    \Mockery::mock('alias:Midtrans\Transaction')
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
            'sender_bank' => 'BCA',
            'sender_account' => '1234567890',
        ],
    ]);

    $response = $this->actingAs($vendorUser)
        ->post("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/manual-payments/{$payment->id}/accept");

    $response->assertRedirect();

    expect($booking->fresh()->status->value)->toBe('down payment');
    expect($payment->fresh()->status->value)->toBe('paid');
    expect($payment->fresh()->paid_at)->not->toBeNull();
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
