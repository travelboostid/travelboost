<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WalletTopup extends Model
{
  protected $fillable = ['user_id', 'amount'];

  public function payment()
  {
    return $this->morphOne(Payment::class, 'payable');
  }

  public function onPaid(Payment $payment)
  {
    $this->user->increment('wallet_balance', $this->amount);
  }

  public function user()
  {
    return $this->belongsTo(User::class);
  }
}
