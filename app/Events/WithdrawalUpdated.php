<?php

namespace App\Events;

use App\Models\Withdrawal;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WithdrawalUpdated
{
  use Dispatchable, SerializesModels;

  /**
   * Create a new event instance.
   */
  public function __construct(public Withdrawal $withdrawal) {}
}
