<?php

use App\Enums\BookingStatus;
use App\Enums\CompanyTeamStatus;
use App\Enums\PaymentStatus;
use App\Enums\VendorAgentPartnerStatus;
use App\Models\Booking;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Tour;
use App\Models\TourAvailability;
use App\Models\TourSchedule;
use App\Models\User;
use App\Models\VendorAgentPartner;
use App\Services\BookingPaymentWorkflowService;
use App\Services\PrismaLinkService;
use Illuminate\Support\Facades\Http;

/**
 * @param  array<string, mixed>  $overrides
 */
function createScheduledBooking(Company $vendor, Tour $tour, array $overrides = []): Booking
{
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
        'available' => 20,
    ]);

    return Booking::factory()->create(array_merge([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'pax_adult' => 1,
        'pax_child' => 0,
    ], $overrides));
}

test('customer online payment to agent stays waiting approval after prismalink confirmation', function () {
    configurePrismaLinkForTests();

    Http::fake([
        'api-staging.plink.co.id/*' => Http::sequence()
            ->push([
                'response_code' => 'PL000',
                'plink_ref_no' => 'PLINK-AGENT-1',
                'transaction_status' => 'PNDNG',
                'validity' => now()->addDay()->toDateTimeString(),
                'va_number_list' => json_encode([
                    ['bank' => 'BCA', 'va' => '80777100123456'],
                ]),
            ])
            ->push([
                'response_code' => 'PL000',
                'payment_status' => 'SETLD',
                'transaction_status' => 'SETLD',
            ]),
    ]);

    $customer = User::factory()->create();
    $vendor = Company::factory()->create(['username' => 'plinkagentvendor', 'type' => 'vendor']);
    $vendor->companySetting()->updateOrCreate([], ['minimum_down_payment' => 30]);
    $agent = Company::factory()->create(['username' => 'plinkagent', 'type' => 'agent']);
    VendorAgentPartner::create([
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'status' => VendorAgentPartnerStatus::ACTIVE,
        'accepted_at' => now(),
        'payment_mode' => 'agent',
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = createScheduledBooking($vendor, $tour, [
        'user_id' => $customer->id,
        'agent_id' => $agent->id,
        'status' => BookingStatus::BOOKING_RESERVED,
        'payment_mode' => 'online',
        'grand_total' => 1_000_000,
    ]);

    $paymentMethod = createPrismaLinkBcaPaymentMethod();

    $this->actingAs($customer)
        ->postJson("/bookings/{$booking->id}/online-payment", [
            'payment_type' => 'down_payment',
            'amount' => 300_000,
            'payment_method_id' => $paymentMethod->id,
        ])
        ->assertOk()
        ->assertJsonPath('payment.payload.payment_flow_stage', 'customer_to_agent');

    $payment = $booking->fresh()->payments()->latest()->first();

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

test('customer reuses active prismalink booking payment attempt while hold is active', function () {
    configurePrismaLinkForTests();

    $user = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $vendor->companySetting()->updateOrCreate([], ['minimum_down_payment' => 30]);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = createScheduledBooking($vendor, $tour, [
        'user_id' => $user->id,
        'status' => BookingStatus::BOOKING_RESERVED,
        'reserved_type' => 'system',
        'reserved_expires_at' => now()->addMinutes(5),
        'grand_total' => 1_000_000,
    ]);

    $payment = $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'provider' => 'prismalink',
        'payment_method' => 'bca_va',
        'amount' => 300_000,
        'status' => 'pending',
        'payload' => [
            'booking_payment_type' => 'down_payment',
            'payment_type' => 'down_payment',
            'merchant_ref_no' => 'PL0000000999testref',
            'plink_ref_no' => 'PLINK-REUSE-1',
            'instruction_type' => 'va',
            'va_number' => '80777100123456',
            'charge_expires_at' => now()->addMinutes(30)->toISOString(),
        ],
        'expired_at' => now()->addMinutes(30),
    ]);

    Http::fake();
    $paymentMethod = createPrismaLinkBcaPaymentMethod();

    $response = $this->actingAs($user)->postJson("/bookings/{$booking->id}/online-payment", [
        'payment_type' => 'down_payment',
        'amount' => 300_000,
        'payment_method_id' => $paymentMethod->id,
    ]);

    $response->assertOk()
        ->assertJsonPath('payment.id', $payment->id)
        ->assertJsonPath('payment.reused', true)
        ->assertJsonPath('payment.payload.merchant_ref_no', 'PL0000000999testref')
        ->assertJsonPath('payment.payload.va_number', '80777100123456');

    expect($booking->fresh()->payments()->where('provider', 'prismalink')->where('status', PaymentStatus::PENDING)->count())->toBe(1);
});

test('prismalink webhook marks online booking payment as paid and updates booking status', function () {
    configurePrismaLinkForTests();

    $user = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = createScheduledBooking($vendor, $tour, [
        'user_id' => $user->id,
        'status' => BookingStatus::BOOKING_RESERVED,
        'grand_total' => 1_000_000,
    ]);

    $service = app(PrismaLinkService::class);
    $payment = $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'provider' => 'prismalink',
        'payment_method' => 'bca_va',
        'amount' => 1_000_000,
        'status' => PaymentStatus::PENDING,
        'payload' => [
            'payment_type' => 'full_payment',
            'merchant_ref_no' => $service->buildMerchantRefNo(999001),
            'plink_ref_no' => 'PLINK-WH-BOOKING',
        ],
    ]);

    $response = $this->postJson('/webhooks/prismalink/backend-callback', [
        'merchant_ref_no' => data_get($payment->payload, 'merchant_ref_no'),
        'transaction_status' => 'SETLD',
    ]);

    $response->assertOk()->assertJsonPath('ack', true);

    expect($payment->fresh()->status)->toBe(PaymentStatus::PAID)
        ->and($booking->fresh()->status)->toBe(BookingStatus::FULL_PAYMENT);
});

test('vendor can review paid prismalink agent-to-vendor payment', function () {
    $vendorUser = User::factory()->create();
    $vendor = Company::factory()->create(['username' => 'plinkvendorreview', 'type' => 'vendor']);
    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $vendorUser->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);
    $agent = Company::factory()->create(['type' => 'agent']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = createScheduledBooking($vendor, $tour, [
        'agent_id' => $agent->id,
        'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
    ]);

    $payment = $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $agent->id,
        'provider' => 'prismalink',
        'payment_method' => 'bca_va',
        'amount' => 500_000,
        'status' => PaymentStatus::PAID,
        'paid_at' => now(),
        'payload' => [
            'payment_flow_stage' => 'agent_to_vendor',
            'vendor_review_status' => 'pending',
            'linked_customer_payment_id' => 1,
        ],
    ]);

    $workflow = app(BookingPaymentWorkflowService::class);

    expect($workflow->canCompanyReviewPayment($vendor, $booking, $payment))->toBeTrue();
});
