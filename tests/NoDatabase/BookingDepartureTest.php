<?php

use App\Models\Booking;
use App\Support\BookingDeparture;

test('has departed returns false when departure is today or in the future', function () {
    $this->travelTo('2026-06-26 12:00:00');

    expect(BookingDeparture::hasDeparted(now()->toDateString()))->toBeFalse()
        ->and(BookingDeparture::hasDeparted(now()->addDay()->toDateString()))->toBeFalse();
});

test('has departed returns true when departure is before today', function () {
    $this->travelTo('2026-06-26 12:00:00');

    expect(BookingDeparture::hasDeparted(now()->subDay()->toDateString()))->toBeTrue();
});

test('has departed returns false when departure date is missing', function () {
    $booking = new Booking(['departure_date' => null]);

    expect(BookingDeparture::hasDepartedBooking($booking))->toBeFalse()
        ->and(BookingDeparture::hasDeparted(null))->toBeFalse();
});
