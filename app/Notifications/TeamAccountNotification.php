<?php

namespace App\Notifications;

use App\Models\Company;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TeamAccountNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Company $company,
        public string $subjectLine,
        public string $headline,
        public string $intro,
        public array $details = [],
        public ?string $closing = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject($this->subjectLine)
            ->view('emails.team-account-notification', [
                'company' => $this->company,
                'headline' => $this->headline,
                'intro' => $this->intro,
                'details' => $this->details,
                'closing' => $this->closing,
                'loginUrl' => route('companies.login.show'),
            ]);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'company_id' => $this->company->id,
            'subject' => $this->subjectLine,
            'headline' => $this->headline,
            'details' => $this->details,
        ];
    }
}
