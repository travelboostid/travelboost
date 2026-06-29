<?php

namespace App\Enums;

enum BookingStatus: string
{
    case AWAITING_PAYMENT = 'awaiting payment';
    case WAITING_PAYMENT_APPROVAL = 'waiting payment approval';
    case DOWN_PAYMENT = 'down payment';
    case FULL_PAYMENT = 'full payment';
    case RESERVED = 'reserved';
    case MANUAL_RESERVED = 'manual reserved';
    case BOOKING_RESERVED = 'booking reserved';
    case CANCELLED = 'cancelled';
    case REFUNDED = 'refunded';
    case EXPIRED = 'expired';
    case WAITING_LIST = 'waiting list';

    /**
     * The two-letter snapshot column code used in tour_availabilities.
     */
    public function snapshotColumn(): string
    {
        return match ($this) {
            self::AWAITING_PAYMENT => 'WP',
            self::WAITING_PAYMENT_APPROVAL => 'WPA',
            self::DOWN_PAYMENT => 'DP',
            self::FULL_PAYMENT => 'FP',
            self::RESERVED => 'BRS',
            self::MANUAL_RESERVED => 'RS',
            self::BOOKING_RESERVED => 'BRS',
            self::CANCELLED => 'CA',
            self::REFUNDED => 'RF',
            self::EXPIRED => 'EX',
            self::WAITING_LIST => 'WL',
        };
    }

    /**
     * Whether this status reduces the available seat count.
     */
    public function reducesAvailability(): bool
    {
        return in_array($this, self::reducingAvailabilityCases(), true);
    }

    /**
     * @return list<self>
     */
    public static function reducingAvailabilityCases(): array
    {
        return [
            self::DOWN_PAYMENT,
            self::FULL_PAYMENT,
            self::RESERVED,
            self::MANUAL_RESERVED,
            self::BOOKING_RESERVED,
            self::WAITING_PAYMENT_APPROVAL,
        ];
    }

    /**
     * @return list<string>
     */
    public static function reducingAvailabilityValues(): array
    {
        return array_map(
            fn (self $status): string => $status->value,
            self::reducingAvailabilityCases(),
        );
    }
}
