<?php

namespace App\Enums;

enum TourWaitingListStatus: string
{
    case PENDING = 'pending';
    case CONTACTED = 'contacted';
    case FULFILLED = 'fulfilled';
    case CANCELLED = 'cancelled';
    case EXPIRED = 'expired';

    /**
     * @return list<string>
     */
    public static function activeValues(): array
    {
        return [self::PENDING->value, self::CONTACTED->value];
    }
}
