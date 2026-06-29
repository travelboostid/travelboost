<?php

use App\Actions\Booking\AssertBookingOnlinePaymentStartAllowedAction;
use App\Enums\CompanyTeamStatus;
use App\Models\Booking;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Tour;
use App\Models\User;
use Illuminate\Support\Facades\Http;

test('customer cannot start a second online payment while checkout is in progress', function () {
    configurePrismaLinkForTests();

    Http::fake([
        'api-staging.plink.co.id/*' => Http::response([
            'response_code' => 'PL000',
            'plink_ref_no' => 'PLINK-CONCURRENT-1',
            'transaction_status' => 'PNDNG',
            'validity' => now()->addDay()->toDateTimeString(),
            'va_number_list' => json_encode([
                ['bank' => 'BRI', 'va' => '77788000999999'],
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
        'reserved_type' => 'payment_in_progress',
    ]);

    $paymentMethod = createPrismaLinkBcaPaymentMethod([
        'method' => 'bri_va',
        'name' => 'PrismaLink BRI Virtual Account',
        'meta' => ['bank_id' => '002'],
    ]);

    $this->actingAs($user)
        ->postJson("/bookings/{$booking->id}/online-payment", [
            'payment_type' => 'down_payment',
            'amount' => 300_000,
            'payment_method_id' => $paymentMethod->id,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('payment')
        ->assertJsonPath(
            'errors.payment.0',
            AssertBookingOnlinePaymentStartAllowedAction::PAYMENT_IN_PROGRESS_MESSAGE,
        );

    expect($booking->fresh()->payments()->count())->toBe(0);
});

test('dashboard cannot start a second online payment while checkout is in progress', function () {
    configurePrismaLinkForTests();

    Http::fake([
        'api-staging.plink.co.id/*' => Http::response([
            'response_code' => 'PL000',
            'plink_ref_no' => 'PLINK-CONCURRENT-DASH',
            'transaction_status' => 'PNDNG',
            'validity' => now()->addDay()->toDateTimeString(),
            'va_number_list' => json_encode([
                ['bank' => 'BRI', 'va' => '77788000888888'],
            ]),
        ]),
    ]);

    $user = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor', 'username' => 'concurrentvendor']);
    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);
    $vendor->companySetting()->updateOrCreate([], [
        'minimum_down_payment' => 30,
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'user_id' => User::factory()->create()->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'reserved',
        'grand_total' => 1_000_000,
        'reserved_type' => 'payment_in_progress',
    ]);

    $paymentMethod = createPrismaLinkBcaPaymentMethod([
        'method' => 'bri_va',
        'name' => 'PrismaLink BRI Virtual Account',
        'meta' => ['bank_id' => '002'],
    ]);

    $this->actingAs($user)
        ->postJson("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/online-payment", [
            'payment_type' => 'down_payment',
            'amount' => 300_000,
            'payment_method_id' => $paymentMethod->id,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('payment')
        ->assertJsonPath(
            'errors.payment.0',
            AssertBookingOnlinePaymentStartAllowedAction::PAYMENT_IN_PROGRESS_MESSAGE,
        );

    expect($booking->fresh()->payments()->count())->toBe(0);
});

test('customer cannot start another online payment when an unpaid prismalink attempt already exists', function () {
    configurePrismaLinkForTests();

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

    $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'provider' => 'prismalink',
        'payment_method' => 'bri_va',
        'amount' => 300_000,
        'status' => 'pending',
        'payload' => ['payment_type' => 'down_payment'],
    ]);

    $paymentMethod = createPrismaLinkBcaPaymentMethod([
        'method' => 'bri_va',
        'name' => 'PrismaLink BRI Virtual Account',
        'meta' => ['bank_id' => '002'],
    ]);

    $this->actingAs($user)
        ->postJson("/bookings/{$booking->id}/online-payment", [
            'payment_type' => 'down_payment',
            'amount' => 300_000,
            'payment_method_id' => $paymentMethod->id,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('payment')
        ->assertJsonPath(
            'errors.payment.0',
            AssertBookingOnlinePaymentStartAllowedAction::PAYMENT_IN_PROGRESS_MESSAGE,
        );

    expect($booking->fresh()->payments()->count())->toBe(1);
});
