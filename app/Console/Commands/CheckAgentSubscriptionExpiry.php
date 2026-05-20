<?php

namespace App\Console\Commands;

use App\Enums\CompanyType;
use App\Models\AgentSubscription;
use App\Notifications\AgentSubscriptionExpiryNotification;
use Illuminate\Console\Command;

class CheckAgentSubscriptionExpiry extends Command
{
    protected $signature = 'agent-subscriptions:check-expiry';

    protected $description = 'Check agent subscription expiry and send renewal notifications.';

    private array $reminderStages = [
        28 => '4 weeks',
        21 => '3 weeks',
        14 => '2 weeks',
        7 => '1 week',
        3 => '3 days',
        2 => '2 days',
        1 => '1 day',
    ];

    public function handle(): int
    {
        $now = now();
        $today = $now->copy()->startOfDay();

        AgentSubscription::query()
            ->with(['company.domain', 'package'])
            ->whereNotNull('ended_at')
            ->whereIn('id', AgentSubscription::query()
                ->selectRaw('MAX(id)')
                ->groupBy('company_id'))
            ->whereHas('company', function ($query): void {
                $query->where('type', CompanyType::AGENT->value);
            })
            ->get()
            ->each(function (AgentSubscription $subscription) use ($now, $today): void {
                $company = $subscription->company;

                if (! $company) {
                    return;
                }

                if ($subscription->ended_at->lt($now)) {
                    $company->domain()?->update(['subdomain_enabled' => false]);
                    $this->notifyOnce($company, $subscription, 'expired', 'expired');

                    return;
                }

                $daysRemaining = (int) $today->diffInDays($subscription->ended_at->copy()->startOfDay(), false);
                $stageLabel = $this->reminderStages[$daysRemaining] ?? null;

                if (! $stageLabel) {
                    return;
                }

                $this->notifyOnce($company, $subscription, "expires_in_{$daysRemaining}_days", $stageLabel);
            });

        return self::SUCCESS;
    }

    private function notifyOnce($company, AgentSubscription $subscription, string $stage, string $stageLabel): void
    {
        $alreadyNotified = $company->notifications()
            ->where('data->type', 'agent_subscription_expiry')
            ->where('data->subscription_id', (string) $subscription->id)
            ->where('data->stage', $stage)
            ->exists();

        if ($alreadyNotified) {
            return;
        }

        $company->notify(new AgentSubscriptionExpiryNotification(
            $company,
            $subscription,
            $stage,
            $stageLabel,
        ));
    }
}
