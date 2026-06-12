<?php

use App\Enums\BookingStatus;
use App\Enums\CompanyTeamStatus;
use App\Enums\PaymentMethodCategory;
use App\Enums\PaymentMethodStatus;
use App\Enums\PaymentStatus;
use App\Enums\VendorAgentPartnerStatus;
use App\Models\Booking;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Domain;
use App\Models\PaymentMethod;
use App\Models\Tour;
use App\Models\TourAvailability;
use App\Models\TourSchedule;
use App\Models\User;
use App\Models\VendorAgentPartner;
use Database\Seeders\Common\RolePermissionSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
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
        'payment_flow_stage' => 'customer_to_agent',
        'counts_toward_booking_total' => false,
        'agent_review_status' => 'pending',
    ]);
});

test('agent accepts customer manual payment proof without finalizing agent collection booking', function () {
    Storage::fake('public');

    $customer = User::factory()->create();
    $agentUser = User::factory()->create();
    $vendor = Company::factory()->create([
        'username' => 'agentproofvendor',
        'type' => 'vendor',
    ]);
    $vendor->companySetting()->updateOrCreate([], [
        'minimum_down_payment' => 30,
    ]);
    $agent = Company::factory()->create([
        'username' => 'agentproofagent',
        'type' => 'agent',
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
        'user_id' => $customer->id,
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => 'reserved',
        'grand_total' => 1_000_000,
    ]);

    $this->actingAs($customer)->post("/bookings/{$booking->id}/manual-payment", [
        'sender_bank_name' => 'BCA',
        'sender_account_number' => '1234567890',
        'transfer_amount' => 500_000,
        'payment_type' => 'down_payment',
        'payment_date' => '2026-05-01',
        'proof' => UploadedFile::fake()->image('proof.jpg'),
    ])->assertRedirect();

    $customerPayment = $booking->fresh()->payments()->latest()->first();

    $this->actingAs($agentUser)
        ->post("/companies/{$agent->username}/dashboard/bookings/{$booking->id}/manual-payments/{$customerPayment->id}/accept")
        ->assertRedirect();

    $customerPayment->refresh();

    expect($customerPayment->status)->toBe(PaymentStatus::PAID)
        ->and(data_get($customerPayment->payload, 'payment_flow_stage'))->toBe('customer_to_agent')
        ->and(data_get($customerPayment->payload, 'agent_review_status'))->toBe('approved')
        ->and(data_get($customerPayment->payload, 'counts_toward_booking_total'))->toBeFalse()
        ->and($booking->fresh()->status)->toBe(BookingStatus::WAITING_PAYMENT_APPROVAL);
});

test('customer online payment to agent stays waiting approval after gateway confirmation', function () {
    $customer = User::factory()->create();
    $vendor = Company::factory()->create([
        'username' => 'onlineagentvendor',
        'type' => 'vendor',
    ]);
    $vendor->companySetting()->updateOrCreate([], [
        'minimum_down_payment' => 30,
    ]);
    $agent = Company::factory()->create([
        'username' => 'onlineagent',
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
        'user_id' => $customer->id,
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::BOOKING_RESERVED,
        'payment_mode' => 'online',
        'grand_total' => 1_000_000,
    ]);

    mockMidtransCoreApiCharge();
    $paymentMethod = createMidtransBcaPaymentMethod();

    $this->actingAs($customer)
        ->postJson("/bookings/{$booking->id}/online-payment", [
            'payment_type' => 'down_payment',
            'amount' => 300_000,
            'payment_method_id' => $paymentMethod->id,
        ])
        ->assertOk()
        ->assertJsonPath('payment.payload.payment_flow_stage', 'customer_to_agent');

    $payment = $booking->fresh()->payments()->latest()->first();

    Mockery::mock('alias:Midtrans\Transaction')
        ->shouldReceive('status')
        ->once()
        ->andReturn((object) [
            'order_id' => data_get($payment->payload, 'order_id'),
            'transaction_status' => 'settlement',
        ]);

    $this->actingAs($customer)
        ->postJson("/bookings/{$booking->id}/online-payment/{$payment->id}/confirm")
        ->assertOk()
        ->assertJsonPath('booking.status', BookingStatus::WAITING_PAYMENT_APPROVAL->value)
        ->assertJsonPath('payment.status', PaymentStatus::PAID->value);

    $payment->refresh();

    expect(data_get($payment->payload, 'payment_flow_stage'))->toBe('customer_to_agent')
        ->and(data_get($payment->payload, 'agent_review_status'))->toBe('approved')
        ->and(data_get($payment->payload, 'counts_toward_booking_total'))->toBeFalse()
        ->and($booking->fresh()->status)->toBe(BookingStatus::WAITING_PAYMENT_APPROVAL);
});

test('agent online payment to vendor remains waiting approval until vendor approves', function () {
    $agentUser = User::factory()->create();
    $vendor = Company::factory()->create([
        'username' => 'agentonlinevendor',
        'type' => 'vendor',
    ]);
    $vendor->companySetting()->updateOrCreate([], [
        'minimum_down_payment' => 30,
    ]);
    $agent = Company::factory()->create([
        'username' => 'agentonlinepayer',
        'type' => 'agent',
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
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
        'payment_mode' => 'manual',
        'grand_total' => 1_000_000,
    ]);
    $customerPayment = $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 500_000,
        'status' => PaymentStatus::PAID,
        'paid_at' => now()->subMinute(),
        'payload' => [
            'booking_payment_type' => 'down_payment',
            'payment_type' => 'down_payment',
            'payment_flow_stage' => 'customer_to_agent',
            'payment_receiver_type' => 'agent',
            'payment_receiver_company_id' => $agent->id,
            'partnership_payment_mode' => 'agent',
            'agent_review_status' => 'approved',
            'counts_toward_booking_total' => false,
        ],
    ]);

    mockMidtransCoreApiCharge();
    $paymentMethod = createMidtransBcaPaymentMethod();

    $this->actingAs($agentUser)
        ->postJson("/companies/{$agent->username}/dashboard/bookings/{$booking->id}/online-payment", [
            'payment_type' => 'down_payment',
            'amount' => 500_000,
            'payment_method_id' => $paymentMethod->id,
        ])
        ->assertOk()
        ->assertJsonPath('payment.payload.payment_flow_stage', 'agent_to_vendor')
        ->assertJsonPath('payment.payload.linked_customer_payment_id', $customerPayment->id)
        ->assertJsonPath('bookingPaymentResult.bookingStatus', BookingStatus::WAITING_PAYMENT_APPROVAL->value);

    $agentVendorPayment = $booking->fresh()->payments
        ->first(fn ($payment): bool => data_get($payment->payload, 'payment_flow_stage') === 'agent_to_vendor');

    Mockery::mock('alias:Midtrans\Transaction')
        ->shouldReceive('status')
        ->once()
        ->andReturn((object) [
            'order_id' => data_get($agentVendorPayment->payload, 'order_id'),
            'transaction_status' => 'settlement',
        ]);

    $this->actingAs($agentUser)
        ->postJson("/companies/{$agent->username}/dashboard/bookings/{$booking->id}/online-payment/{$agentVendorPayment->id}/confirm")
        ->assertOk()
        ->assertJsonPath('booking.status', BookingStatus::WAITING_PAYMENT_APPROVAL->value)
        ->assertJsonPath('payment.status', PaymentStatus::PAID->value);

    $agentVendorPayment->refresh();

    expect($booking->fresh()->status)->toBe(BookingStatus::WAITING_PAYMENT_APPROVAL)
        ->and(data_get($agentVendorPayment->payload, 'payment_flow_stage'))->toBe('agent_to_vendor')
        ->and(data_get($agentVendorPayment->payload, 'vendor_review_status'))->toBe('pending')
        ->and(data_get($agentVendorPayment->payload, 'counts_toward_booking_total'))->toBeFalse();
});

test('agent online payment to vendor reuses active snap attempt', function () {
    $agentUser = User::factory()->create();
    $vendor = Company::factory()->create([
        'username' => 'agentreusevendor',
        'type' => 'vendor',
    ]);
    $agent = Company::factory()->create([
        'username' => 'agentreusepayer',
        'type' => 'agent',
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
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
        'payment_mode' => 'online',
        'grand_total' => 1_000_000,
    ]);
    $customerPayment = $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'provider' => 'midtrans',
        'payment_method' => 'snap',
        'amount' => 500_000,
        'status' => PaymentStatus::PAID,
        'paid_at' => now()->subMinute(),
        'payload' => [
            'booking_payment_type' => 'down_payment',
            'payment_type' => 'down_payment',
            'payment_flow_stage' => 'customer_to_agent',
            'payment_receiver_type' => 'agent',
            'payment_receiver_company_id' => $agent->id,
            'partnership_payment_mode' => 'agent',
            'agent_review_status' => 'approved',
            'counts_toward_booking_total' => false,
            'order_id' => 'customer-agent-order',
            'snap_token' => 'customer-agent-token',
        ],
    ]);
    $agentVendorPayment = $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $agentUser->id,
        'provider' => 'midtrans',
        'payment_method' => 'snap',
        'amount' => 500_000,
        'status' => PaymentStatus::PENDING,
        'payload' => [
            'booking_payment_type' => 'down_payment',
            'payment_type' => 'down_payment',
            'payment_flow_stage' => 'agent_to_vendor',
            'linked_customer_payment_id' => $customerPayment->id,
            'payment_receiver_type' => 'vendor',
            'payment_receiver_company_id' => $vendor->id,
            'partnership_payment_mode' => 'agent',
            'vendor_review_status' => 'pending',
            'counts_toward_booking_total' => false,
            'order_id' => 'agent-vendor-order',
            'instruction_type' => 'va',
            'va_number' => '80777100888888',
            'charge_expires_at' => now()->addMinutes(30)->toISOString(),
        ],
        'expired_at' => now()->addMinutes(30),
    ]);

    Mockery::mock('alias:Midtrans\CoreApi')
        ->shouldReceive('charge')
        ->never();
    $paymentMethod = createMidtransBcaPaymentMethod();

    $this->actingAs($agentUser)
        ->postJson("/companies/{$agent->username}/dashboard/bookings/{$booking->id}/online-payment", [
            'payment_type' => 'down_payment',
            'amount' => 500_000,
            'payment_method_id' => $paymentMethod->id,
        ])
        ->assertOk()
        ->assertJsonPath('payment.id', $agentVendorPayment->id)
        ->assertJsonPath('payment.reused', true)
        ->assertJsonPath('payment.payload.order_id', 'agent-vendor-order')
        ->assertJsonPath('payment.payload.va_number', '80777100888888');

    expect($booking->fresh()->payments()
        ->where('provider', 'midtrans')
        ->where('status', PaymentStatus::PENDING)
        ->count())->toBe(1);
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

test('customer can create an online booking payment with midtrans core api', function () {
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

    mockMidtransCoreApiCharge();
    $paymentMethod = createMidtransBcaPaymentMethod();

    $response = $this->actingAs($user)->postJson("/bookings/{$booking->id}/online-payment", [
        'payment_type' => 'down_payment',
        'amount' => 300_000,
        'payment_method_id' => $paymentMethod->id,
    ]);

    $response->assertOk()
        ->assertJsonPath('payment.payload.va_number', '80777100123456')
        ->assertJsonPath('payment.payload.instruction_type', 'va')
        ->assertJsonPath('payment.payload.payment_type', 'down_payment');

    $this->assertDatabaseHas('payments', [
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'midtrans',
        'payment_method' => 'bca_va',
        'amount' => 300_000,
        'status' => 'pending',
    ]);

    expect($booking->fresh()->payment_mode)->toBe('online');
});

test('customer can create an online booking payment with prismalink', function () {
    config([
        'prismalink.merchant_id' => 'merchant',
        'prismalink.merchant_key_id' => 'key',
        'prismalink.secret_key' => 'secret',
        'prismalink.backend_callback_url' => 'https://tunnel-8000.travelboost.co.id/webhooks/prismalink/backend-callback',
        'prismalink.frontend_callback_url' => 'https://tunnel-8000.travelboost.co.id',
    ]);

    Http::fake([
        'api-staging.plink.co.id/*' => Http::response([
            'response_code' => 'PL000',
            'plink_ref_no' => 'PLINK-BOOKING-1',
            'transaction_status' => 'PNDNG',
            'validity' => now()->addDay()->toDateTimeString(),
            'va_number_list' => json_encode([
                ['bank' => 'BRI', 'va' => '77788000123456'],
            ]),
        ]),
    ]);

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

    $paymentMethod = PaymentMethod::query()->create([
        'provider' => 'prismalink',
        'method' => 'bri_va',
        'name' => 'PrismaLink BRI Virtual Account',
        'description' => 'Test PrismaLink BRI VA',
        'category' => PaymentMethodCategory::BANK_TRANSFER,
        'status' => PaymentMethodStatus::ENABLED,
        'meta' => [
            'bank_id' => '002',
        ],
    ]);

    $response = $this->actingAs($user)->postJson("/bookings/{$booking->id}/online-payment", [
        'payment_type' => 'down_payment',
        'amount' => 300_000,
        'payment_method_id' => $paymentMethod->id,
    ]);

    $response->assertOk()
        ->assertJsonPath('payment.provider', 'prismalink')
        ->assertJsonPath('payment.payload.instruction_type', 'va')
        ->assertJsonPath('payment.payload.bank', 'bri')
        ->assertJsonPath('payment.payload.va_number', '77788000123456')
        ->assertJsonPath('payment.payload.payment_type', 'down_payment');

    Http::assertSent(function ($request): bool {
        $payload = json_decode($request->body(), true);

        return is_array($payload)
            && ($payload['backend_callback_url'] ?? null) === 'https://tunnel-8000.travelboost.co.id/webhooks/prismalink/backend-callback'
            && ($payload['frontend_callback_url'] ?? null) === 'https://tunnel-8000.travelboost.co.id';
    });

    $this->assertDatabaseHas('payments', [
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'prismalink',
        'payment_method' => 'bri_va',
        'amount' => 300_000,
        'status' => 'pending',
    ]);

    expect($booking->fresh()->payment_mode)->toBe('online');
});

test('customer reuses active online booking payment attempt while hold is active', function () {
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
        'status' => BookingStatus::BOOKING_RESERVED,
        'reserved_type' => 'system',
        'reserved_expires_at' => now()->addMinutes(5),
        'grand_total' => 1_000_000,
    ]);

    $payment = $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'provider' => 'midtrans',
        'payment_method' => 'bca_va',
        'amount' => 300_000,
        'status' => 'pending',
        'payload' => [
            'booking_payment_type' => 'down_payment',
            'payment_type' => 'down_payment',
            'order_id' => 'old-booking-order',
            'instruction_type' => 'va',
            'va_number' => '80777100123456',
            'charge_expires_at' => now()->addMinutes(30)->toISOString(),
        ],
        'expired_at' => now()->addMinutes(30),
    ]);

    Mockery::mock('alias:Midtrans\CoreApi')
        ->shouldReceive('charge')
        ->never();
    $paymentMethod = createMidtransBcaPaymentMethod();

    $response = $this->actingAs($user)->postJson("/bookings/{$booking->id}/online-payment", [
        'payment_type' => 'down_payment',
        'amount' => 300_000,
        'payment_method_id' => $paymentMethod->id,
    ]);

    $response->assertOk()
        ->assertJsonPath('payment.id', $payment->id)
        ->assertJsonPath('payment.reused', true)
        ->assertJsonPath('payment.payload.order_id', 'old-booking-order')
        ->assertJsonPath('payment.payload.va_number', '80777100123456')
        ->assertJsonPath('bookingPaymentResult.bookingStatus', 'booking reserved')
        ->assertJsonPath('bookingPaymentResult.paymentStatus', 'pending');

    expect($booking->fresh()->status)->toBe(BookingStatus::BOOKING_RESERVED)
        ->and($booking->fresh()->payments()->where('provider', 'midtrans')->where('status', PaymentStatus::PENDING)->count())->toBe(1);
});

test('customer creates new online booking payment when previous core api attempt is expired', function () {
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
        'status' => BookingStatus::BOOKING_RESERVED,
        'reserved_type' => 'system',
        'reserved_expires_at' => now()->addMinutes(5),
        'grand_total' => 1_000_000,
    ]);

    $oldPayment = $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'provider' => 'midtrans',
        'payment_method' => 'bca_va',
        'amount' => 300_000,
        'status' => PaymentStatus::PENDING,
        'payload' => [
            'booking_payment_type' => 'down_payment',
            'payment_type' => 'down_payment',
            'order_id' => 'expired-booking-order',
            'instruction_type' => 'va',
            'va_number' => '80777100999999',
            'charge_expires_at' => now()->subMinute()->toISOString(),
        ],
        'expired_at' => now()->subMinute(),
    ]);

    mockMidtransCoreApiCharge();
    $paymentMethod = createMidtransBcaPaymentMethod();

    $response = $this->actingAs($user)->postJson("/bookings/{$booking->id}/online-payment", [
        'payment_type' => 'down_payment',
        'amount' => 300_000,
        'payment_method_id' => $paymentMethod->id,
    ]);

    $response->assertOk()
        ->assertJsonPath('payment.reused', false)
        ->assertJsonPath('payment.payload.va_number', '80777100123456')
        ->assertJsonPath('bookingPaymentResult.paymentStatus', 'pending');

    $oldPayment->refresh();
    $newPayment = $booking->fresh()->payments()
        ->where('provider', 'midtrans')
        ->where('id', '!=', $oldPayment->id)
        ->latest('id')
        ->first();

    expect($oldPayment->status)->toBe(PaymentStatus::FAILED)
        ->and($newPayment->id)->not->toBe($oldPayment->id)
        ->and(data_get($newPayment->payload, 'order_id'))->not->toBe('expired-booking-order')
        ->and(data_get($newPayment->payload, 'charge_expires_at'))->not->toBeNull();
});

test('dashboard online full payment keeps down payment booking status until midtrans confirms', function () {
    $user = User::factory()->create();
    $vendorUser = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $vendor->companySetting()->updateOrCreate([], [
        'minimum_down_payment' => 30,
    ]);
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

    mockMidtransCoreApiCharge();
    $paymentMethod = createMidtransBcaPaymentMethod();

    $response = $this->actingAs($vendorUser)
        ->postJson("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/online-payment", [
            'payment_type' => 'full_payment',
            'amount' => 750_000,
            'payment_method_id' => $paymentMethod->id,
        ]);

    $response->assertOk()
        ->assertJsonPath('payment.payload.va_number', '80777100123456')
        ->assertJsonPath('payment.payload.payment_type', 'full_payment')
        ->assertJsonPath('bookingPaymentResult.bookingStatus', 'down payment')
        ->assertJsonPath('bookingPaymentResult.paymentStatus', 'pending');

    expect($booking->fresh()->status)->toBe(BookingStatus::DOWN_PAYMENT)
        ->and($booking->fresh()->payment_mode)->toBe('online');
});

test('dashboard online payment preserves waiting approval payment process status until midtrans confirms', function () {
    $user = User::factory()->create();
    $vendorUser = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $vendor->companySetting()->updateOrCreate([], [
        'minimum_down_payment' => 30,
    ]);
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
        'reserved_type' => 'payment_in_progress',
        'payment_mode' => 'manual',
        'grand_total' => 1_000_000,
        'total_price' => 1_000_000,
        'tax_amount' => 0,
        'platform_fee' => 0,
        'commission_amount' => 0,
    ]);

    mockMidtransCoreApiCharge();
    $paymentMethod = createMidtransBcaPaymentMethod();

    $response = $this->actingAs($vendorUser)
        ->postJson("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/online-payment", [
            'payment_type' => 'down_payment',
            'amount' => 500_000,
            'payment_method_id' => $paymentMethod->id,
        ]);

    $response->assertOk()
        ->assertJsonPath('payment.payload.va_number', '80777100123456')
        ->assertJsonPath('bookingPaymentResult.bookingStatus', 'waiting payment approval')
        ->assertJsonPath('bookingPaymentResult.paymentStatus', 'pending');

    expect($booking->fresh()->status)->toBe(BookingStatus::WAITING_PAYMENT_APPROVAL)
        ->and($booking->fresh()->reserved_type)->toBe('payment_in_progress')
        ->and($booking->fresh()->payment_mode)->toBe('online');
});

test('dashboard full payment amount must cover finalizable remaining balance', function () {
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
        'status' => PaymentStatus::PAID,
        'payload' => ['payment_type' => 'down_payment'],
        'paid_at' => now()->subDay(),
    ]);

    $paymentMethod = createMidtransBcaPaymentMethod();

    $response = $this->actingAs($vendorUser)
        ->postJson("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/online-payment", [
            'payment_type' => 'full_payment',
            'amount' => 500_000,
            'payment_method_id' => $paymentMethod->id,
        ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors('payment');

    expect($booking->fresh()->payments()->count())->toBe(1);
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

    mockMidtransCoreApiCharge();
    $paymentMethod = createMidtransBcaPaymentMethod();

    $response = $this->actingAs($user)->postJson("/bookings/{$booking->id}/online-payment", [
        'payment_type' => 'full_payment',
        'amount' => 750_000,
        'payment_method_id' => $paymentMethod->id,
    ]);

    $response->assertOk()
        ->assertJsonPath('payment.payload.va_number', '80777100123456')
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

test('customer midtrans expired status fails the payment attempt without finalizing booking while hold is active', function () {
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
        'reserved_expires_at' => now()->addMinutes(5),
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
            'order_id' => 'expired-booking-order',
            'request' => [
                'transaction_details' => [
                    'order_id' => 'expired-booking-order',
                ],
            ],
        ],
    ]);

    Mockery::mock('alias:Midtrans\Transaction')
        ->shouldReceive('status')
        ->once()
        ->with('expired-booking-order')
        ->andReturn((object) [
            'order_id' => 'expired-booking-order',
            'transaction_status' => 'expire',
        ]);

    $response = $this->actingAs($user)
        ->postJson("/bookings/{$booking->id}/online-payment/{$payment->id}/confirm");

    $response->assertOk()
        ->assertJsonPath('booking.status', 'booking reserved')
        ->assertJsonPath('payment.status', 'failed')
        ->assertJsonPath('bookingPaymentResult.bookingStatus', 'booking reserved')
        ->assertJsonPath('bookingPaymentResult.paymentStatus', 'failed')
        ->assertJsonPath('bookingPaymentResult.paidAmount', 0);

    expect($booking->fresh()->status)->toBe(BookingStatus::BOOKING_RESERVED)
        ->and($payment->fresh()->status)->toBe(PaymentStatus::FAILED);
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
    expect(data_get($payment->fresh()->payload, 'payment_type'))->toBe('down_payment')
        ->and(data_get($payment->fresh()->payload, 'transaction_status'))->toBe('settlement')
        ->and(data_get($payment->fresh()->payload, 'midtrans'))->toBeNull();
});

test('midtrans webhook repairs already paid booking payment with stale awaiting payment status', function () {
    $user = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::AWAITING_PAYMENT,
        'payment_mode' => 'online',
        'grand_total' => 1_000_000,
        'reserved_expires_at' => now()->addMinutes(5),
    ]);

    $payment = $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'provider' => 'midtrans',
        'payment_method' => 'snap',
        'amount' => 200_000,
        'status' => 'paid',
        'paid_at' => now()->subMinute(),
        'payload' => [
            'payment_type' => 'down_payment',
        ],
    ]);

    $response = $this->postJson('/webhooks/midtrans/notification', [
        'order_id' => $payment->id.'-booking',
        'transaction_status' => 'settlement',
    ]);

    $response->assertOk()
        ->assertJsonPath('message', 'Payment already processed');

    expect($booking->fresh()->status)->toBe(BookingStatus::DOWN_PAYMENT)
        ->and($booking->fresh()->reserved_expires_at)->toBeNull()
        ->and($payment->fresh()->status)->toBe(PaymentStatus::PAID);
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

test('booking create refresh excludes agent vendor settlement from paid amount', function () {
    $user = User::factory()->create();
    $vendor = Company::factory()->create([
        'username' => 'agentcollectionpaidvendor',
        'type' => 'vendor',
    ]);
    $agent = Company::factory()->create([
        'username' => 'agentcollectionpaidagent',
        'type' => 'agent',
    ]);
    VendorAgentPartner::create([
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'status' => VendorAgentPartnerStatus::ACTIVE,
        'accepted_at' => now(),
        'payment_mode' => 'agent',
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
        'agent_id' => $agent->id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'status' => BookingStatus::DOWN_PAYMENT,
        'payment_mode' => 'manual',
        'grand_total' => 1_000_000,
    ]);
    $customerPayment = $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 250_000,
        'status' => PaymentStatus::PAID,
        'paid_at' => now()->subDay(),
        'payload' => [
            'payment_type' => 'down_payment',
            'booking_payment_type' => 'down_payment',
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
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 250_000,
        'status' => PaymentStatus::PAID,
        'paid_at' => now()->subDay(),
        'payload' => [
            'payment_type' => 'down_payment',
            'booking_payment_type' => 'down_payment',
            'payment_flow_stage' => 'agent_to_vendor',
            'linked_customer_payment_id' => $customerPayment->id,
            'payment_receiver_type' => 'vendor',
            'payment_receiver_company_id' => $vendor->id,
            'partnership_payment_mode' => 'agent',
            'vendor_review_status' => 'approved',
            'counts_toward_booking_total' => false,
        ],
    ]);

    $response = $this->actingAs($user)->get(route('bookings.create', [
        'username' => $vendor->username,
        'tour' => $tour,
        'date' => $schedule->departure_date,
        'booking_number' => $booking->booking_number,
    ]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tours/bookings/create')
        ->where('paidAmount', 250000)
        ->where('remainingBalance', 750000)
        ->where('bookingPaymentResult.paidAmount', 250000)
        ->where('bookingPaymentResult.remainingBalance', 750000));
});

test('customer full payment amount must cover finalizable remaining balance', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::DOWN_PAYMENT,
        'grand_total' => 1_000_000,
    ]);
    $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 250_000,
        'status' => PaymentStatus::PAID,
        'paid_at' => now()->subDay(),
        'payload' => [
            'payment_type' => 'down_payment',
            'counts_toward_booking_total' => true,
        ],
    ]);

    $response = $this->actingAs($user)
        ->from("/bookings/{$booking->id}/manual-payment")
        ->post("/bookings/{$booking->id}/manual-payment", [
            'sender_bank_name' => 'BCA',
            'sender_account_number' => '1234567890',
            'transfer_amount' => 500_000,
            'payment_type' => 'full_payment',
            'payment_date' => '2026-05-01',
            'proof' => UploadedFile::fake()->image('underpaid-full-payment.jpg'),
        ]);

    $response->assertSessionHasErrors('payment');

    expect($booking->payments()->count())->toBe(1)
        ->and(Storage::disk('public')->allFiles('payment-proofs'))->toBe([]);
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
