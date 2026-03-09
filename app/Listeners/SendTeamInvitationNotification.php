<?php

namespace App\Listeners;

use App\Enums\CompanyTeamStatus;
use App\Events\CompanyTeamCreated;
use App\Notifications\TeamInvitationNotification;
use Illuminate\Support\Facades\Notification;

class SendTeamInvitationNotification
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
  public function handle(CompanyTeamCreated $event): void
  {
    if ($event->team->status !== CompanyTeamStatus::PENDING) {
      return;
    }
    if (!$event->team->user == null) {
      // Notify the user via email if not registered yet, using the invite email
      Notification::route('mail', $event->team->invite_email)
        ->notify(new TeamInvitationNotification($event->team));
    } else {
      // Send notification to the user directly if user is available. Possibly not just via email, but also via in-app notification
      Notification::send($event->team->user, new TeamInvitationNotification($event->team));
    }
  }
}
