<?php

namespace App\Jobs;

use App\Enums\WithdrawalMethod;
use App\Enums\WithdrawalStatus;
use App\Models\Withdrawal;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessAutoWithdrawalJob implements ShouldQueue
{
  use Dispatchable;
  use InteractsWithQueue;
  use Queueable;
  use SerializesModels;

  public function __construct(
    public Withdrawal $withdrawal,
  ) {}

  public function handle(): void
  {
    $withdrawal = $this->withdrawal->fresh();

    if (! $withdrawal) {
      return;
    }

    if ($withdrawal->method !== WithdrawalMethod::AUTO) {
      return;
    }

    if ($withdrawal->status !== WithdrawalStatus::PROCESSING) {
      return;
    }

    $wallet = $withdrawal->loadMissing('wallet')->wallet;

    if (! $wallet) {
      return;
    }

    $wallet->withdraw($withdrawal->amount);

    // TODO: process payout

    $withdrawal->update([
      'paid_at' => now(),
      'status' => WithdrawalStatus::PAID,
    ]);
  }
}
