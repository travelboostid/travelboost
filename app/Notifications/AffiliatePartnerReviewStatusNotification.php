<?php

namespace App\Notifications;

use App\Models\AffiliateProfile;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AffiliatePartnerReviewStatusNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public AffiliateProfile $affiliateProfile,
        public AffiliateProfile $maProfile,
        public string $status,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $statusLabel = $this->status === 'approved' ? 'approved' : 'rejected';

        return (new MailMessage)
            ->subject("Affiliate {$statusLabel} in your network")
            ->view('emails.affiliate-network-notification', [
                'eyebrow' => 'Partner Network Update',
                'headline' => "Affiliate {$statusLabel} by master affiliate review",
                'intro' => 'A master affiliate in your network has completed the review of a downline affiliate. The latest result is below.',
                'details' => [
                    ['label' => 'Master Affiliate', 'value' => $this->maProfile->user->name ?? '-'],
                    ['label' => 'Affiliate Name', 'value' => $this->affiliateProfile->user->name ?? '-'],
                    ['label' => 'Email', 'value' => $this->affiliateProfile->user->email ?? '-'],
                    ['label' => 'Phone', 'value' => $this->affiliateProfile->phone ?: ($this->affiliateProfile->user->phone ?? '-')],
                    ['label' => 'Decision', 'value' => ucfirst($this->status)],
                ],
                'actionLabel' => 'Open Notifications',
                'actionUrl' => route('affiliate.panel.notifications.index'),
                'closing' => 'You can continue monitoring the network from your affiliate dashboard.',
            ]);
    }

    public function toArray(object $notifiable): array
    {
        $affiliateName = $this->affiliateProfile->user->name ?? 'An affiliate';
        $maName = $this->maProfile->user->name ?? 'Master Affiliate';
        $statusLabel = $this->status === 'approved' ? 'approved' : 'rejected';

        return [
            'title' => "Affiliate {$statusLabel} in your network",
            'message' => "{$maName} has {$statusLabel} {$affiliateName} in your network.",
            'type' => 'affiliate_review_status',
            'affiliate_profile_id' => $this->affiliateProfile->id,
            'status' => $this->status,
            'action_url' => '/affiliate/dashboard/notifications',
        ];
    }
}
