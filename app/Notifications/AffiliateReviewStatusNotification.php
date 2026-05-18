<?php

namespace App\Notifications;

use App\Models\AffiliateProfile;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AffiliateReviewStatusNotification extends Notification
{
    use Queueable;

    public function __construct(
        public AffiliateProfile $affiliateProfile,
        public string $status,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $isApproved = $this->status === 'approved';

        return (new MailMessage)
            ->subject($isApproved ? 'Your affiliate account has been approved' : 'Your affiliate account has been rejected')
            ->view('emails.affiliate-network-notification', [
                'eyebrow' => 'Affiliate Review Result',
                'headline' => $isApproved ? 'Your account is approved' : 'Your account was not approved',
                'intro' => $isApproved
                    ? 'Your affiliate account has been approved. You can now log in and continue building your TravelBoost affiliate journey.'
                    : 'Your affiliate account has been reviewed and was not approved at this time. Please contact TravelBoost or your upline if you need further clarification.',
                'details' => [
                    ['label' => 'Name', 'value' => $this->affiliateProfile->user->name ?? '-'],
                    ['label' => 'Email', 'value' => $this->affiliateProfile->user->email ?? '-'],
                    ['label' => 'Phone', 'value' => $this->affiliateProfile->phone ?: ($this->affiliateProfile->user->phone ?? '-')],
                    ['label' => 'Status', 'value' => ucfirst($this->status)],
                ],
                'actionLabel' => 'Open Affiliate Login',
                'actionUrl' => route('affiliate.panel.login'),
                'closing' => $isApproved
                    ? 'Thank you for joining TravelBoost. We are excited to have you in the network.'
                    : 'You may review your details and contact your upline if you would like to understand the decision.',
            ]);
    }
}
