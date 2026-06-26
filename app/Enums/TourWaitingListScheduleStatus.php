<?php

namespace App\Enums;

enum TourWaitingListScheduleStatus: string
{
    case QUEUED = 'queued';
    case OFFERED = 'offered';
    case FULFILLED = 'fulfilled';
    case EXPIRED = 'expired';
    case CANCELLED = 'cancelled';
    case SKIPPED = 'skipped';

    /**
     * @return list<string>
     */
    public static function activeQueueValues(): array
    {
        return [self::QUEUED->value, self::OFFERED->value];
    }
}
