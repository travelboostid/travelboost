<?php

namespace App\Notifications;

use App\Models\VendorAgentPartner;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PaymentModeChangedNotification extends Notification
{
  use Queueable;

  protected $partnership;

  public function __construct(VendorAgentPartner $partnership)
  {
    $this->partnership = $partnership;
  }

  public function via($notifiable): array
  {
    return ['database'];
  }

  public function toArray($notifiable): array
  {
    $vendorName = $this->partnership->vendor->name;
    $mode = strtoupper($this->partnership->payment_mode);

    return [
      'title' => 'Metode Pembayaran Diperbarui',
      'message' => "{$vendorName} telah mengubah metode pembayaran kemitraan Anda menjadi: {$mode}.",
      'type' => 'payment_mode_change',
      'action_url' => "/companies/{$notifiable->username}/dashboard/vendor-registrations",
    ];
  }
}
