<?php

namespace App\Notifications;

use App\Models\AffiliateProfile;
use App\Models\Company;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AgentJoinedAffiliateNetworkNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Company $company,
        public ?AffiliateProfile $affiliateProfile,
        public ?AffiliateProfile $maProfile,
        public string $recipientRole,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $details = [
            ['label' => 'Agency Name', 'value' => $this->company->name],
            ['label' => 'Owner Name', 'value' => $this->company->users()->first()?->name ?? '-'],
            ['label' => 'Email', 'value' => $this->company->email ?? '-'],
            ['label' => 'Phone', 'value' => $this->company->phone ?? '-'],
        ];

        if ($this->affiliateProfile?->user) {
            $details[] = ['label' => 'Referred By', 'value' => $this->affiliateProfile->user->name];
        }

        if ($this->maProfile?->user && $this->recipientRole === 'partner') {
            $details[] = ['label' => 'Master Affiliate', 'value' => $this->maProfile->user->name];
        }

        return (new MailMessage)
            ->subject('New agent joined your TravelBoost network')
            ->view('emails.affiliate-network-notification', [
                'eyebrow' => 'Agent Network Update',
                'headline' => 'A new agent completed onboarding',
                'intro' => $this->introText(),
                'details' => $details,
                'actionLabel' => 'Open Affiliate Dashboard',
                'actionUrl' => route('affiliate.panel.notifications.index'),
                'closing' => 'This is an informational update. No approval action is required.',
            ]);
    }

    public function toArray(object $notifiable): array
    {
        $agencyName = $this->company->name;
        $affiliateName = $this->affiliateProfile?->user?->name;
        $maName = $this->maProfile?->user?->name;

        return [
            'title' => 'New agent joined your network',
            'message' => match ($this->recipientRole) {
                'affiliate' => "{$agencyName} has completed onboarding using your referral.",
                'master_affiliate' => $affiliateName
                    ? "{$agencyName} has completed onboarding under {$affiliateName} in your network."
                    : "{$agencyName} has completed onboarding in your network.",
                'partner' => $maName
                    ? "{$agencyName} has completed onboarding through {$maName}'s network."
                    : "{$agencyName} has completed onboarding in your network.",
                default => "{$agencyName} has completed onboarding in your network.",
            },
            'type' => 'agent_registration',
            'company_id' => $this->company->id,
            'recipient_role' => $this->recipientRole,
            'action_url' => '/affiliate/dashboard/notifications',
        ];
    }

    private function introText(): string
    {
        return match ($this->recipientRole) {
            'affiliate' => 'A new agent has completed onboarding using your referral code. The agent is now active in your TravelBoost network.',
            'master_affiliate' => 'A new agent has completed onboarding under an affiliate in your network. This notification is provided so you can monitor your network growth.',
            'partner' => 'A new agent has completed onboarding through one of the master affiliates in your network. This notification is provided so you can monitor your network growth.',
            default => 'A new agent has completed onboarding in your TravelBoost network.',
        };
    }
}
