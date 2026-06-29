<?php

namespace App\Support;

final class BookingAvailabilityMessages
{
    public const RESERVE = 'Only :limit seat(s) remain for this departure. Please reduce the number of guests or choose another date.';

    public const PAYMENT = 'Seats for this departure are no longer available. Please choose another date or contact customer support.';

    public const FINALIZATION = 'Payment could not be completed because seats for this departure are no longer available. If you were charged, please contact customer support for assistance.';

    public const MISSING_SCHEDULE = 'This departure is no longer available because the tour schedule is missing. Please contact customer support.';

    public static function forReserve(int $freeSeats): string
    {
        return str_replace(':limit', (string) max(0, $freeSeats), self::RESERVE);
    }

    public static function forPayment(): string
    {
        return self::PAYMENT;
    }

    public static function forFinalization(): string
    {
        return self::FINALIZATION;
    }

    public static function missingSchedule(): string
    {
        return self::MISSING_SCHEDULE;
    }
}
