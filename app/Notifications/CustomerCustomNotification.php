<?php

namespace App\Notifications;

use App\Models\Company;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CustomerCustomNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $title,
        public string $message,
        public string $channel,
        public Company $senderCompany,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return match ($this->channel) {
            'email' => ['mail'],
            'both' => ['database', 'mail'],
            default => ['database'],
        };
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject($this->title)
            ->view('emails.travelboost-message', [
                'title' => $this->title,
                'preheader' => $this->message,
                'eyebrow' => 'Customer Update',
                'headline' => $this->title,
                'intro' => $this->message,
                'detailsTitle' => 'Sender Details',
                'details' => [
                    ['label' => 'Sent By', 'value' => $this->senderCompany->name],
                ],
                'actionLabel' => 'View My Bookings',
                'actionUrl' => url('/mybookings'),
                'closing' => "Sent by {$this->senderCompany->name}.",
            ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => $this->title,
            'message' => $this->message,
            'type' => 'customer_custom_notification',
            'sender_company_id' => $this->senderCompany->id,
            'sender_company_name' => $this->senderCompany->name,
            'action_url' => '/mybookings',
        ];
    }
}
