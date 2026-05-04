<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewReferralNotification extends Notification
{
  use Queueable;

  public $agentName;

  public function __construct($agentName)
  {
    $this->agentName = $agentName;
  }

  public function via($notifiable)
  {
    return ['database'];
  }

  public function toDatabase($notifiable)
  {
    return [
      'title' => 'Agen Baru Bergabung',
      'message' => "Agen {$this->agentName} baru saja mendaftar menggunakan kode referal Anda.",
      'type' => 'referral',
    ];
  }
}
