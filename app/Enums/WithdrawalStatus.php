<?php

namespace App\Enums;

enum WithdrawalStatus: string
{
  case PENDING  = 'pending';   // user submits
  case PROCESSING = 'processing';  // processing by admin
  case REJECTED   = 'rejected';    // admin rejects
  case CANCELLED  = 'cancelled'; // user cancel
  case PAID       = 'paid';        // paid and completed
}
