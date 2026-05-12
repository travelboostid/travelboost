<?php

namespace App\Models;

use App\Enums\WithdrawalStatus;
use Bavix\Wallet\Models\Wallet;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Withdrawal extends Model
{
  protected $fillable = [
    'owner_type',
    'owner_id',
    'bank_account_id',
    'wallet_id',
    'amount',
    'status',
    'note',
    'approved_at',
    'processed_at',
    'paid_at',
  ];

  protected $casts = [
    'amount' => 'decimal:2',
    'approved_at' => 'datetime',
    'processed_at' => 'datetime',
    'paid_at' => 'datetime',
    'status' => WithdrawalStatus::class,
  ];

  public function owner()
  {
    return $this->morphTo();
  }

  public function bankAccount(): BelongsTo
  {
    return $this->belongsTo(BankAccount::class);
  }

  public function wallet(): BelongsTo
  {
    return $this->belongsTo(Wallet::class);
  }
}
