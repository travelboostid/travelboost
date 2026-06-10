<?php

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\Company;
use App\Models\Payment;
use App\Models\Tour;
use App\Models\TourAvailability;
use App\Models\TourSchedule;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Artisan;

test('overdue down payment bookings are cancelled after the full payment due date in Jakarta time', function () {
    $this->travelTo(CarbonImmutable::parse('2026-06-09 00:00:00', 'Asia/Jakarta'));

    $vendor = Company::factory()->create(['type' => 'vendor']);
    $vendor->companySetting()->update(['full_payment_deadline' => 1]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $vendor->id,
        'departure_date' => '2026-06-09',
        'return_date' => '2026-06-12',
        'is_active' => true,
    ]);
    $availability = TourAvailability::create([
        'company_id' => $vendor->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 10,
        'available' => 8,
        'DP' => 2,
    ]);
    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'departure_date' => '2026-06-09',
        'status' => BookingStatus::DOWN_PAYMENT,
        'reserved_expires_at' => now()->addDay(),
        'pax_adult' => 2,
        'pax_child' => 0,
        'pax_infant' => 0,
    ]);
    $paidDownPayment = Payment::create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 500_000,
        'status' => PaymentStatus::PAID,
        'paid_at' => now()->subDay(),
        'payload' => [
            'payment_type' => 'down_payment',
        ],
    ]);
    $pendingFullPayment = Payment::create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 1_000_000,
        'status' => PaymentStatus::PENDING,
        'payload' => [
            'payment_type' => 'full_payment',
        ],
    ]);

    Artisan::call('booking:cancel-overdue-down-payments');

    expect($booking->fresh()->status)->toBe(BookingStatus::CANCELLED)
        ->and($booking->fresh()->reserved_expires_at)->toBeNull()
        ->and($paidDownPayment->fresh()->status)->toBe(PaymentStatus::PAID)
        ->and($pendingFullPayment->fresh()->status)->toBe(PaymentStatus::CANCELLED)
        ->and((int) $availability->fresh()->DP)->toBe(0)
        ->and((int) $availability->fresh()->CA)->toBe(2)
        ->and((float) $availability->fresh()->available)->toBe(10.0);
});

test('down payment bookings are not cancelled on the due date in Jakarta time', function () {
    $this->travelTo(CarbonImmutable::parse('2026-06-08 23:59:59', 'Asia/Jakarta'));

    $vendor = Company::factory()->create(['type' => 'vendor']);
    $vendor->companySetting()->update(['full_payment_deadline' => 1]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $vendor->id,
        'departure_date' => '2026-06-09',
        'return_date' => '2026-06-12',
        'is_active' => true,
    ]);
    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'departure_date' => '2026-06-09',
        'status' => BookingStatus::DOWN_PAYMENT,
    ]);

    Artisan::call('booking:cancel-overdue-down-payments');

    expect($booking->fresh()->status)->toBe(BookingStatus::DOWN_PAYMENT);
});
