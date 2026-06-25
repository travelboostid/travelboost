<?php

namespace App\Notifications;

use App\Models\AffiliateProfile;
use App\Models\AgentSubscription;
use App\Models\AgentSubscriptionPackage;
use App\Models\Company;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AffiliateAgentSubscriptionNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Company $company,
        public AgentSubscription $subscription,
        public AgentSubscriptionPackage $package,
        public ?AffiliateProfile $affiliateProfile,
        public ?AffiliateProfile $maProfile,
        public string $recipientRole,
        public float $commissionAmount,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Agent subscription confirmed in your TravelBoost network')
            ->view('emails.affiliate-network-notification', [
                'eyebrow' => 'Network Subscription Update',
                'headline' => 'An agent subscription has been confirmed',
                'intro' => $this->introText(),
                'details' => $this->details(),
                'actionLabel' => 'Open Affiliate Dashboard',
                'actionUrl' => route('affiliate.panel.notifications.index'),
                'closing' => 'This update is provided so you can monitor subscription activity and expected commission in your TravelBoost network.',
            ]);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Agent subscription confirmed',
            'message' => "{$this->company->name} subscribed to {$this->package->name}. Expected commission: {$this->formatRupiah($this->commissionAmount)}.",
            'type' => 'agent_subscription',
            'company_id' => $this->company->id,
            'subscription_id' => $this->subscription->id,
            'recipient_role' => $this->recipientRole,
            'commission_amount' => $this->commissionAmount,
            'action_url' => '/affiliate/dashboard/notifications',
        ];
    }

    private function details(): array
    {
        $details = [
            ['label' => 'Agent Name', 'value' => $this->company->name],
            ['label' => 'Subscription Package', 'value' => $this->package->name],
            ['label' => 'Start Date', 'value' => $this->subscription->started_at?->format('d M Y') ?? '-'],
            ['label' => 'End Date', 'value' => $this->subscription->ended_at?->format('d M Y') ?? '-'],
            ['label' => 'Commission', 'value' => $this->formatRupiah($this->commissionAmount)],
        ];

        if ($this->affiliateProfile?->user) {
            $details[] = ['label' => 'Affiliator Network', 'value' => $this->affiliateProfile->user->name];
            $details[] = ['label' => 'Referral Code', 'value' => $this->affiliateProfile->referral_code ?? '-'];
        }

        if ($this->maProfile?->user && $this->recipientRole === 'partner') {
            $details[] = ['label' => 'Master Affiliate', 'value' => $this->maProfile->user->name];
        }

        return $details;
    }

    private function introText(): string
    {
        return match ($this->recipientRole) {
            'affiliate' => 'An agent in your referral network has completed a subscription payment. The subscription has been confirmed by Midtrans.',
            'master_affiliate' => 'An agent under one of your affiliates has completed a subscription payment. The subscription has been confirmed by Midtrans.',
            'partner' => 'An agent under one of your master affiliate networks has completed a subscription payment. The subscription has been confirmed by Midtrans.',
            default => 'An agent in your TravelBoost network has completed a subscription payment. The subscription has been confirmed by Midtrans.',
        };
    }

    private function formatRupiah(float $amount): string
    {
        return 'Rp '.number_format($amount, 0, ',', '.');
    }
}
