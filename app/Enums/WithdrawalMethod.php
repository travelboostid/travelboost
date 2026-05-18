<?php

namespace App\Enums;

enum WithdrawalMethod: string
{
  case AUTO = 'auto';
  case MANUAL_TRIGGER = 'manual-trigger';
  case MANUAL_TRANSFER = 'manual-transfer';
}
