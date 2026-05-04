<?php

namespace App\Traits;

use App\Models\BankAccount;

trait HasBankAccounts
{
  public function bankAccounts()
  {
    return $this->morphMany(BankAccount::class, 'owner');
  }
}
