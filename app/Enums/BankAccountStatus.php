<?php

namespace App\Enums;

enum BankAccountStatus: string
{
  case PENDING  = 'pending';   // waiting for verification
  case VERIFIED = 'verified';  // approved & usable
  case REJECTED = 'rejected';  // failed verification
}
