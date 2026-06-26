<?php

namespace App\Notifications;

use App\Models\Company;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AgentOnboardingWelcomeNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Company $company,
        public User $agent,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Welcome to TravelBoost')
            ->view('emails.affiliate-network-notification', [
                'eyebrow' => 'Agent Registration',
                'headline' => 'Welcome to TravelBoost',
                'intro' => 'Your agent account has been completed successfully. You can now access your dashboard, manage your company profile, and start using TravelBoost for your travel business.',
                'details' => [
                    ['label' => 'Agent Name', 'value' => $this->company->name],
                    ['label' => 'Account Owner', 'value' => $this->agent->name],
                    ['label' => 'Email', 'value' => $this->agent->email],
                    ['label' => 'Phone', 'value' => $this->company->phone ?: ($this->agent->phone ?? '-')],
                    ['label' => 'Status', 'value' => 'Active'],
                ],
                'actionLabel' => 'Open Company Login',
                'actionUrl' => route('companies.login.show'),
                'closing' => 'Thank you for joining TravelBoost. We are excited to support your next stage of growth.',
            ]);
    }
}
