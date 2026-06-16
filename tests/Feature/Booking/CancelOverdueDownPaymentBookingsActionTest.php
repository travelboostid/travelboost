<?php

use App\Actions\Booking\CancelOverdueDownPaymentBookingsAction;
use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\BookingActionRequest;
use App\Models\Company;
use App\Models\Payment;
use App\Models\Tour;
use App\Models\User;
use Database\Seeders\Common\RolePermissionSeeder;
use Illuminate\Support\Facades\DB;
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

test('down payment booking past the final payment deadline is cancelled by the system', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $vendor->companySetting()->update(['full_payment_deadline' => 7]);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);

    // Departure is 5 days from now; with a 7-day deadline the final payment
    // deadline was 2 days ago, so the booking is overdue.
    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::DOWN_PAYMENT,
        'departure_date' => now()->addDays(5)->toDateString(),
    ]);
    Payment::create([
        'owner_type' => User::class,
        'owner_id' => $this->user->id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 500_000,
        'status' => PaymentStatus::PAID,
    ]);
    Payment::create([
        'owner_type' => User::class,
        'owner_id' => $this->user->id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 500_000,
        'status' => PaymentStatus::PENDING,
    ]);

    $count = app(CancelOverdueDownPaymentBookingsAction::class)->execute();

    expect($count)->toBe(1);
    expect($booking->fresh()->status)->toBe(BookingStatus::CANCELLED);

    $pendingPayment = $booking->payments()->where('status', PaymentStatus::PENDING->value)->first();
    expect($pendingPayment)->toBeNull();
});

test('system cancellation creates a booking_action_request entry visible in the cancellation list', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $vendor->companySetting()->update(['full_payment_deadline' => 7]);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);

    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::DOWN_PAYMENT,
        'departure_date' => now()->subDay()->toDateString(),
        'booking_number' => 'BKG-SYS-CANCEL',
    ]);

    app(CancelOverdueDownPaymentBookingsAction::class)->execute();

    $action = BookingActionRequest::query()
        ->where('booking_id', $booking->id)
        ->where('target_action', 'cancel')
        ->first();

    expect($action)->not->toBeNull();
    expect($action->status)->toBe('approved');
    expect($action->reviewer_user_id)->toBeNull();
    expect($action->reviewer_company_id)->toBeNull();
    expect($action->reason)->toContain('automatically cancelled by the system');
    expect($action->reason)->toContain('final payment deadline');
    expect($action->reason)->toContain('Cancelled by system');
    expect($action->reviewed_at)->not->toBeNull();
});

test('system cancellation is attributed to the booking agent when one exists so the agent can see it', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $vendor->companySetting()->update(['full_payment_deadline' => 7]);
    $agent = Company::factory()->create(['type' => 'agent']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);

    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::DOWN_PAYMENT,
        'departure_date' => now()->subDay()->toDateString(),
    ]);

    app(CancelOverdueDownPaymentBookingsAction::class)->execute();

    $action = BookingActionRequest::query()
        ->where('booking_id', $booking->id)
        ->where('target_action', 'cancel')
        ->first();

    expect($action)->not->toBeNull();
    expect((int) $action->requester_company_id)->toBe((int) $agent->id);
});

test('bookings whose final payment deadline has not passed are not cancelled', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $vendor->companySetting()->update(['full_payment_deadline' => 7]);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);

    // Departure is 30 days from now, deadline is 7 days before, so the
    // deadline is still 23 days away.
    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::DOWN_PAYMENT,
        'departure_date' => now()->addDays(30)->toDateString(),
    ]);

    $count = app(CancelOverdueDownPaymentBookingsAction::class)->execute();

    expect($count)->toBe(0);
    expect($booking->fresh()->status)->toBe(BookingStatus::DOWN_PAYMENT);
    expect(BookingActionRequest::query()->where('booking_id', $booking->id)->exists())->toBeFalse();
});
