<?php

namespace App\Enums;

use App\Support\BookingAvailabilityMessages;

enum BookingAvailabilityContext: string
{
    case Reserve = 'reserve';
    case Payment = 'payment';
    case Finalization = 'finalization';

    public function validationField(): string
    {
        return match ($this) {
            self::Reserve => 'availability',
            self::Payment, self::Finalization => 'payment',
        };
    }

    public function message(int $freeSeats = 0): string
    {
        return match ($this) {
            self::Reserve => BookingAvailabilityMessages::forReserve($freeSeats),
            self::Payment => BookingAvailabilityMessages::forPayment(),
            self::Finalization => BookingAvailabilityMessages::forFinalization(),
        };
    }
}
