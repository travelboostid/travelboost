<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiCreditTopupPayment extends Model
{
  protected $fillable = ['amount'];

  public function payment()
  {
    return $this->morphOne(Payment::class, 'payable');
  }
}
