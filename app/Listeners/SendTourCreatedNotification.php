<?php

namespace App\Listeners;

use App\Enums\VendorAgentPartnerStatus;
use App\Events\TourCreated;
use App\Notifications\TourCreatedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Notification;

class SendTourCreatedNotification
{
  /**
   * Create the event listener.
   */
  public function __construct()
  {
    //
  }

  /**
   * Handle the event.
   */
  public function handle(TourCreated $event)
  {
    // $receivers = $event->tour->company->agentPartners()->where('status', VendorAgentPartnerStatus::ACTIVE)->get();
    // Notification::send($receivers, new TourCreatedNotification($event->tour));
    // Notification::route('mail', 'irvan.herz@gmail.com')
    //   ->notify(new TourCreatedNotification($event->tour));
  }
}
