<?php

namespace App\Enums;

enum PaymentMethodStatus: string
{
    case ENABLED = 'enabled';
    case DISABLED = 'disabled';
    case MAINTENANCE = 'maintenance';
}
