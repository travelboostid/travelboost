<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BankAccount extends Model
{
  protected $fillable = [
    'owner_type',
    'owner_id',
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

  public function owner()
  {
    return $this->morphTo();
  }

  public function withdrawals(): HasMany
  {
    return $this->hasMany(Withdrawal::class);
  }
}
