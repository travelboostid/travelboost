<?php

namespace App\Enums;

enum BookingActionType: string
{
    case CANCEL = 'cancel';
    case REFUND = 'refund';
    case RESCHEDULE = 'reschedule';
    case RESTORE = 'restore';
}
