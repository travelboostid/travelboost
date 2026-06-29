<?php

use App\Actions\Booking\AssertScheduleSeatAvailabilityAction;
use App\Actions\Booking\FinalizeBookingPaymentAction;
use App\Enums\BookingAvailabilityContext;
use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Company;
use App\Models\Tour;
use App\Models\TourSchedule;
use App\Support\BookingAvailabilityMessages;
use Illuminate\Validation\ValidationException;

test('payment seat check rejects booking when schedule row is missing', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);

    $booking = Booking::factory()->create([
        'tour_id' => $tour->id,
        'vendor_id' => $vendor->id,
        'departure_date' => now()->addDays(30)->toDateString(),
        'status' => BookingStatus::BOOKING_RESERVED,
        'pax_adult' => 1,
        'pax_child' => 0,
    ]);

    expect(fn () => app(AssertScheduleSeatAvailabilityAction::class)->assertForBooking(
        $booking,
        BookingAvailabilityContext::Payment,
    ))->toThrow(ValidationException::class);

    try {
        app(AssertScheduleSeatAvailabilityAction::class)->assertForBooking(
            $booking,
            BookingAvailabilityContext::Payment,
        );
    } catch (ValidationException $exception) {
        expect($exception->errors()['payment'][0])->toBe(BookingAvailabilityMessages::missingSchedule());
    }
});

test('finalization seat check rejects booking when schedule row is missing', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);

    $booking = Booking::factory()->create([
        'tour_id' => $tour->id,
        'vendor_id' => $vendor->id,
        'departure_date' => now()->addDays(30)->toDateString(),
        'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
        'pax_adult' => 1,
        'pax_child' => 0,
    ]);

    expect(fn () => app(AssertScheduleSeatAvailabilityAction::class)->assertForBooking(
        $booking,
        BookingAvailabilityContext::Finalization,
    ))->toThrow(ValidationException::class);
});

test('finalization action fails when availability snapshot is missing', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);

    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $vendor->id,
        'departure_date' => now()->addDays(30)->toDateString(),
        'return_date' => now()->addDays(35)->toDateString(),
        'is_active' => true,
    ]);

    $booking = Booking::factory()->create([
        'tour_id' => $tour->id,
        'vendor_id' => $vendor->id,
        'departure_date' => $schedule->departure_date,
        'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
        'pax_adult' => 1,
        'pax_child' => 0,
    ]);

    $booking->payments()->create([
        'owner_type' => Company::class,
        'owner_id' => $vendor->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 1_000_000,
        'status' => 'paid',
        'payload' => ['payment_type' => 'down_payment'],
    ]);

    expect(fn () => app(FinalizeBookingPaymentAction::class)->execute($booking->fresh()))
        ->toThrow(ValidationException::class);
});
