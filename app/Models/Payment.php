<?php

namespace App\Models;

use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Payment extends Model
{
  use HasFactory;

  protected $fillable = [
    'owner_id',
    'owner_type',
    'payable_id',
    'payable_type',
    'provider',
    'payment_method',
    'amount',
    'status',
    'payload',
    'paid_at',
  ];

  protected function casts(): array
  {
    return [
      'status' => PaymentStatus::class,
      'payload' => 'array',
      'paid_at' => 'datetime',
      'amount' => 'decimal:2',
    ];
  }

  public function owner(): MorphTo
  {
    return $this->morphTo();
  }

  public function payable(): MorphTo
  {
    return $this->morphTo();
  }
}
