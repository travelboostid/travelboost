<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class PromotionBudgetTopupPayment extends Model
{
    protected $fillable = ['amount'];

    public function payment(): MorphOne
    {
        return $this->morphOne(Payment::class, 'payable');
    }
}
