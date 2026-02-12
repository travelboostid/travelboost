<?php

namespace App\Enums;

enum WithdrawalStatus: string
{
  case REQUESTED  = 'requested';   // user submits
  case APPROVED   = 'approved';    // admin approves
  case PROCESSING = 'processing';  // wallet debited
  case PAID       = 'paid';        // payout success
  case REJECTED   = 'rejected';    // admin rejects
  case FAILED     = 'failed';      // payout failed (refund needed)
  case CANCELLED  = 'cancelled'; // user cancel
}
