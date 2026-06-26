<?php

namespace App\Notifications;

use App\Models\AffiliateProfile;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AffiliateRegistrationWelcomeNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public User $user,
        public ?AffiliateProfile $uplineProfile = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $details = [
            ['label' => 'Name', 'value' => $this->user->name],
            ['label' => 'Email', 'value' => $this->user->email],
            ['label' => 'Phone', 'value' => $this->user->phone ?: '-'],
            ['label' => 'Status', 'value' => 'Pending Approval'],
        ];

        if ($this->uplineProfile?->user) {
            $details[] = [
                'label' => 'Review By',
                'value' => $this->uplineProfile->user->name,
            ];
        }

        return (new MailMessage)
            ->subject('Welcome to TravelBoost Affiliate Network')
            ->view('emails.affiliate-network-notification', [
                'eyebrow' => 'Affiliate Registration',
                'headline' => 'Welcome to TravelBoost',
                'intro' => 'Your affiliate account has been created successfully and is currently waiting for review. We will notify you as soon as your account is approved or rejected.',
                'details' => $details,
                'actionLabel' => 'Open Affiliate Login',
                'actionUrl' => route('affiliate.panel.login'),
                'closing' => 'Please keep your email active so you do not miss the next update from TravelBoost.',
            ]);
    }
}
