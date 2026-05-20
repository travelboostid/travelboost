<?php

namespace App\Notifications;

use App\Models\AgentSubscription;
use App\Models\Company;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AgentSubscriptionExpiryNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Company $company,
        public AgentSubscription $subscription,
        public string $stage,
        public string $stageLabel,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $isExpired = $this->stage === 'expired';

        return (new MailMessage)
            ->subject($isExpired ? 'Your TravelBoost subscription has expired' : 'Your TravelBoost subscription is ending soon')
            ->view('emails.affiliate-network-notification', [
                'eyebrow' => $isExpired ? 'Subscription Expired' : 'Subscription Reminder',
                'headline' => $isExpired ? 'Your subscription has expired' : 'Your subscription is ending soon',
                'intro' => $isExpired
                    ? 'Your TravelBoost subscription has expired. Please renew your subscription immediately to continue using all sales and marketing features, keep your agent website accessible, and maintain withdrawal access for commissions.'
                    : "Your TravelBoost subscription will expire in {$this->stageLabel}. Please renew your subscription to avoid limitations on sales and marketing features, agent website access, and commission withdrawal access.",
                'details' => [
                    ['label' => 'Agency Name', 'value' => $this->company->name],
                    ['label' => 'Subscription Package', 'value' => $this->subscription->package?->name ?? '-'],
                    ['label' => 'Start Date', 'value' => $this->subscription->started_at?->format('d M Y') ?? '-'],
                    ['label' => 'End Date', 'value' => $this->subscription->ended_at?->format('d M Y') ?? '-'],
                    ['label' => 'Status', 'value' => $isExpired ? 'Expired' : 'Ending Soon'],
                ],
                'actionLabel' => 'Renew Subscription',
                'actionUrl' => url("/companies/{$this->company->username}/dashboard/agent-subscriptions"),
                'closing' => $isExpired
                    ? 'Your agent website subdomain has been disabled until the subscription is renewed.'
                    : 'Renew before the expiry date to keep your TravelBoost access uninterrupted.',
            ]);
    }

    public function toArray(object $notifiable): array
    {
        $isExpired = $this->stage === 'expired';

        return [
            'title' => $isExpired ? 'Subscription expired' : 'Subscription ending soon',
            'message' => $isExpired
                ? 'Your subscription has expired. Renew now to restore agent website access and continue using TravelBoost features.'
                : "Your subscription will expire in {$this->stageLabel}. Renew now to keep your access uninterrupted.",
            'type' => 'agent_subscription_expiry',
            'stage' => $this->stage,
            'company_id' => $this->company->id,
            'subscription_id' => (string) $this->subscription->id,
            'action_url' => "/companies/{$this->company->username}/dashboard/agent-subscriptions",
        ];
    }
}
