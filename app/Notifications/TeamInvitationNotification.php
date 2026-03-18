<?php

namespace App\Notifications;

use App\Models\CompanyTeam;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TeamInvitationNotification extends Notification
{
  use Queueable;

  public CompanyTeam $team;

  /**
   * Create a new notification instance.
   */
  public function __construct(CompanyTeam $team)
  {
    $this->team = $team;
  }

  /**
   * Get the notification's delivery channels.
   *
   * @return array<int, string>
   */
  public function via(object $notifiable): array
  {
    return ['mail'];
  }

  /**
   * Get the mail representation of the notification.
   */
  public function toMail(object $notifiable): MailMessage
  {
    return (new MailMessage)
      ->subject('You are invited to join a team on TravelBoost')
      ->greeting('Hello!')
      ->line('You are invited to join the team "' . $this->team->company->name . '" on TravelBoost.')
      ->line('Please click the button below to register your account and join the team.')
      ->action('Join Team', route('register'))
      ->line('If you did not expect this invitation, you can ignore this email.');
  }

  /**
   * Get the array representation of the notification.
   *
   * @return array<string, mixed>
   */
  public function toArray(object $notifiable): array
  {
    return [
      'team_id' => $this->team->id,
      'company_id' => $this->team->company->id,
      'invite_email' => $this->team->invite_email,
    ];
  }
}
