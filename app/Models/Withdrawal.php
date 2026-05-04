<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Withdrawal extends Model
{
  protected $fillable = [
    'user_id',
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
  ];

  /**
   * Status constants (optional but recommended)
   */
  public const STATUS_REQUESTED  = 'requested';
  public const STATUS_APPROVED   = 'approved';
  public const STATUS_PROCESSING = 'processing';
  public const STATUS_PAID       = 'paid';
  public const STATUS_REJECTED   = 'rejected';
  public const STATUS_FAILED     = 'failed';

  /* -------------------------
     | Relationships
     |--------------------------*/

  public function user(): BelongsTo
  {
    return $this->belongsTo(User::class);
  }

  public function bankAccount(): BelongsTo
  {
    return $this->belongsTo(BankAccount::class);
  }
}
