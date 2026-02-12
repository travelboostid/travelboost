<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BankAccount extends Model
{
  protected $fillable = [
    'user_id',
    'provider',
    'account_number',
    'account_name',
    'branch',
    'status',
    'is_default',
  ];

  protected $casts = [
    'is_default' => 'boolean',
  ];

  /**
   * Status constants
   */
  public const STATUS_PENDING  = 'pending';
  public const STATUS_VERIFIED = 'verified';
  public const STATUS_REJECTED = 'rejected';

  /* -------------------------
     | Relationships
     |--------------------------*/

  public function user(): BelongsTo
  {
    return $this->belongsTo(User::class);
  }

  public function withdrawals(): HasMany
  {
    return $this->hasMany(Withdrawal::class);
  }
}
