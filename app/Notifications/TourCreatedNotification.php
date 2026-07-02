<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TourCreatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $tour;

    /**
     * Create a new notification instance.
     */
    public function __construct($tour)
    {
        $this->tour = $tour;
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
            ->subject('A new tour has been created')
            ->view('emails.travelboost-message', [
                'title' => 'A new tour has been created',
                'preheader' => 'Your tour has been created successfully.',
                'eyebrow' => 'Tour Update',
                'headline' => 'A new tour has been created',
                'intro' => 'Your tour has been created successfully in TravelBoost.',
                'detailsTitle' => 'Tour Details',
                'details' => [
                    ['label' => 'Tour', 'value' => (string) data_get($this->tour, 'name', 'New Tour')],
                    ['label' => 'Code', 'value' => (string) data_get($this->tour, 'code', '-')],
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
