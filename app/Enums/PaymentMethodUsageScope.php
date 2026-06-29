<?php

namespace App\Enums;

enum PaymentMethodUsageScope: string
{
    case Booking = 'booking';
    case Platform = 'platform';
}
