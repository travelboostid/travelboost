<?php

namespace App\Notifications;

use App\Models\AgentSubscription;
use App\Models\AgentSubscriptionPackage;
use App\Models\Company;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AgentSubscriptionActivatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Company $company,
        public AgentSubscription $subscription,
        public AgentSubscriptionPackage $package,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Your TravelBoost subscription is active')
            ->view('emails.affiliate-network-notification', [
                'eyebrow' => 'Subscription Confirmed',
                'headline' => 'Your subscription is now active',
                'intro' => 'Your subscription payment has been confirmed successfully. Your TravelBoost subscription is active and ready to support your agency operations.',
                'details' => [
                    ['label' => 'Agent Name', 'value' => $this->company->name],
                    ['label' => 'Subscription Package', 'value' => $this->package->name],
                    ['label' => 'Package Price', 'value' => $this->formatRupiah((float) $this->package->price)],
                    ['label' => 'Start Date', 'value' => $this->subscription->started_at?->format('d M Y') ?? '-'],
                    ['label' => 'End Date', 'value' => $this->subscription->ended_at?->format('d M Y') ?? '-'],
                    ['label' => 'Status', 'value' => 'Active'],
                ],
                'actionLabel' => 'Open Company Dashboard',
                'actionUrl' => route('companies.dashboard.index', ['company' => $this->company->username]),
                'closing' => 'Thank you for subscribing to TravelBoost. Your dashboard access and subscription benefits are now available.',
            ]);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Subscription payment confirmed',
            'message' => "{$this->package->name} is active from {$this->subscription->started_at?->format('d M Y')} to {$this->subscription->ended_at?->format('d M Y')}.",
            'type' => 'agent_subscription',
            'company_id' => $this->company->id,
            'subscription_id' => $this->subscription->id,
            'action_url' => "/companies/{$this->company->username}/dashboard",
        ];
    }

    private function formatRupiah(float $amount): string
    {
        return 'Rp '.number_format($amount, 0, ',', '.');
    }
}
