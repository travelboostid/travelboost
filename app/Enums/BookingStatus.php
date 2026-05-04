<?php

namespace App\Enums;

enum BookingStatus: string
{
    case AWAITING_PAYMENT = 'awaiting payment';
    case DOWN_PAYMENT = 'down payment';
    case FULL_PAYMENT = 'full payment';
    case RESERVED = 'reserved';
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
            self::DOWN_PAYMENT => 'DP',
            self::FULL_PAYMENT => 'FP',
            self::RESERVED => 'RS',
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
        return match ($this) {
            self::DOWN_PAYMENT,
            self::FULL_PAYMENT,
            self::RESERVED => true,
            default => false,
        };
    }
}
