<?php

namespace App\Enums;

enum BookingStatus: string
{
  case RESERVED = 'reserved';
  case AWAITING_PAYMENT = 'awaiting payment';
  case PAID = 'paid';
  case CANCELLED = 'cancelled';
  case COMPLETED = 'completed';
  case REFUNDED = 'refunded';
}
