<?php

namespace App\Models;

use App\Actions\AgentSubscription\ActivateAgentSubscriptionPaymentAction;
use Illuminate\Database\Eloquent\Model;

class AgentSubscriptionPayment extends Model
{
    protected $fillable = ['package_id'];

    public function payment()
    {
        return $this->morphOne(Payment::class, 'payable');
    }

    public function package()
    {
        return $this->belongsTo(AgentSubscriptionPackage::class, 'package_id');
    }

    public function onPaid(Payment $payment): void
    {
        app(ActivateAgentSubscriptionPaymentAction::class)->execute($payment);
    }
}
