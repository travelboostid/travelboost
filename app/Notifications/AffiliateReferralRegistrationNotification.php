<?php

namespace App\Notifications;

use App\Models\AffiliateProfile;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AffiliateReferralRegistrationNotification extends Notification
{
    use Queueable;

    public function __construct(
        public AffiliateProfile $affiliateProfile,
        public AffiliateProfile $maProfile,
        public string $recipientRole,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $isPartnerRecipient = $this->recipientRole === 'partner';

        $details = [
            ['label' => 'Affiliate Name', 'value' => $this->affiliateProfile->user->name ?? '-'],
            ['label' => 'Email', 'value' => $this->affiliateProfile->user->email ?? '-'],
            ['label' => 'Phone', 'value' => $this->affiliateProfile->phone ?: ($this->affiliateProfile->user->phone ?? '-')],
        ];

        if ($isPartnerRecipient) {
            $details[] = [
                'label' => 'Master Affiliate',
                'value' => $this->maProfile->user->name ?? '-',
            ];
        }

        return (new MailMessage)
            ->subject($isPartnerRecipient ? 'New affiliate registration in your network' : 'New affiliate pending your review')
            ->view('emails.affiliate-network-notification', [
                'eyebrow' => $isPartnerRecipient ? 'Partner Network Update' : 'Affiliate Review Required',
                'headline' => $isPartnerRecipient ? 'A new affiliate joined your network' : 'A new affiliate needs your review',
                'intro' => $isPartnerRecipient
                    ? 'A new affiliate has registered in your network through one of your master affiliates. You can monitor the review progress from your dashboard.'
                    : 'A new affiliate has registered using your referral code. Please review the application and decide whether to approve or reject it.',
                'details' => $details,
                'actionLabel' => $isPartnerRecipient ? 'Open Affiliate Dashboard' : 'Review Affiliate Application',
                'actionUrl' => $isPartnerRecipient ? route('affiliate.panel.notifications.index') : route('affiliate.panel.network.approvals'),
                'closing' => $isPartnerRecipient
                    ? 'TravelBoost will keep you informed about the final review result.'
                    : 'Please review the application promptly to keep your affiliate network moving.',
            ]);
    }

    public function toArray(object $notifiable): array
    {
        $affiliateName = $this->affiliateProfile->user->name ?? 'An affiliate';
        $affiliateEmail = $this->affiliateProfile->user->email ?? '-';
        $affiliatePhone = $this->affiliateProfile->phone ?: ($this->affiliateProfile->user->phone ?? '-');
        $maName = $this->maProfile->user->name ?? 'Master Affiliate';
        $isPartnerRecipient = $this->recipientRole === 'partner';

        return [
            'title' => $isPartnerRecipient
                ? 'New affiliate joined your network'
                : 'New affiliate pending your review',
            'message' => $isPartnerRecipient
                ? "{$affiliateName} joined your network through {$maName}. Email: {$affiliateEmail}. Phone: {$affiliatePhone}."
                : "{$affiliateName} registered using your referral code. Email: {$affiliateEmail}. Phone: {$affiliatePhone}. Please review this application.",
            'type' => 'affiliate_registration',
            'affiliate_profile_id' => $this->affiliateProfile->id,
            'action_url' => $isPartnerRecipient
                ? '/affiliate/dashboard/notifications'
                : '/affiliate/dashboard/network/approvals',
        ];
    }
}
