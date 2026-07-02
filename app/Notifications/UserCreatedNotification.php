<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UserCreatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct()
    {
        //
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
            ->subject('Welcome to TravelBoost')
            ->view('emails.travelboost-message', [
                'title' => 'Welcome to TravelBoost',
                'preheader' => 'Your account has been created successfully.',
                'eyebrow' => 'Account Created',
                'headline' => 'Welcome to TravelBoost',
                'intro' => 'Your account has been created successfully and is ready to use.',
                'detailsTitle' => 'Account Details',
                'details' => [
                    ['label' => 'Status', 'value' => 'Active'],
                ],
                'actionLabel' => 'Open TravelBoost',
                'actionUrl' => url('/'),
                'closing' => 'Thank you for using TravelBoost.',
            ]);
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}
