<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AgentSubscriptionPayment extends Model
{
  protected $fillable = ['package_id'];

  public function payment()
  {
    return $this->morphOne(Payment::class, 'payable');
  }
}
