<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WalletTopupPayment extends Model
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
