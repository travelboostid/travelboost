<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WalletTopupPayment extends Model
{
  protected $fillable = ['amount'];

  public function payment()
  {
    return $this->morphOne(Payment::class, 'payable');
  }
}
