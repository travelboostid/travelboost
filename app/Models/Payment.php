<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
  protected $fillable = [
    'user_id',
    'provider',
    'payment_method',
    'amount',
    'status',
    'payload',
    'paid_at',
  ];

  protected $casts = [
    'payload' => 'array',
    'paid_at' => 'datetime',
  ];

  public function payable()
  {
    return $this->morphTo();
  }

  public function markPaid(array $payload = [])
  {
    if ($this->status === 'paid') {
      return; // idempotent
    }

    $this->update([
      'status' => 'paid',
      'payload' => $payload,
      'paid_at' => now(),
    ]);
  }
}
