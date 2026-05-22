<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class CommissionReceivedNotification extends Notification
{
    use Queueable;

    public $agentName;

    public $amount;

    public $tier;

    public function __construct($agentName, $amount, $tier)
    {
        $this->agentName = $agentName;
        $this->amount = $amount;
        $this->tier = $tier;
    }

    public function via($notifiable)
    {
        return ['database'];
    }

    public function toDatabase($notifiable)
    {
        return [
            'title' => 'Komisi Langganan Diterima',
            'message' => 'Anda menerima komisi sebesar Rp '.number_format($this->amount, 0, ',', '.').",- dari pembayaran langganan agen {$this->agentName} (Tingkat: {$this->tier}).",
            'type' => 'commission',
        ];
    }
}
