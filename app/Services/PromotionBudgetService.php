<?php

namespace App\Services;

use App\Enums\AdCampaignStatus;
use App\Enums\AdPlatform;
use App\Enums\PromotionBudgetTransactionType;
use App\Models\AdCampaign;
use App\Models\Company;
use App\Models\PromotionBudget;
use App\Models\PromotionBudgetTransaction;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class PromotionBudgetService
{
    public function balance(Company $company): float
    {
        return (float) ($company->promotionBudget?->balance ?? 0);
    }

    public function assertCanFundDailyBudget(Company $company, float $dailyBudget): void
    {
        if ($dailyBudget <= 0) {
            throw new RuntimeException('Daily budget must be greater than zero.');
        }

        if ($this->balance($company) < $dailyBudget) {
            throw new RuntimeException('Insufficient promotion budget for this daily budget.');
        }
    }

    public function recordSpend(
        Company $company,
        AdPlatform $platform,
        float $amount,
        AdCampaign $campaign,
        string $description,
        string $idempotencyKey,
    ): void {
        if ($amount <= 0) {
            return;
        }

        DB::transaction(function () use ($company, $platform, $amount, $campaign, $description, $idempotencyKey): void {
            $exists = PromotionBudgetTransaction::query()
                ->where('type', PromotionBudgetTransactionType::Spend)
                ->where('meta->idempotency_key', $idempotencyKey)
                ->exists();

            if ($exists) {
                return;
            }

            $budget = PromotionBudget::query()
                ->where('company_id', $company->id)
                ->lockForUpdate()
                ->first();

            if (! $budget) {
                return;
            }

            $deduct = min((float) $budget->balance, $amount);

            if ($deduct <= 0) {
                return;
            }

            $budget->decrement('balance', $deduct);

            PromotionBudgetTransaction::query()->create([
                'company_id' => $company->id,
                'type' => PromotionBudgetTransactionType::Spend,
                'platform' => $platform->value,
                'amount' => $deduct,
                'reference_type' => $campaign->getMorphClass(),
                'reference_id' => $campaign->id,
                'description' => $description,
                'meta' => [
                    'idempotency_key' => $idempotencyKey,
                    'campaign_id' => $campaign->id,
                    'external_campaign_id' => $campaign->external_campaign_id,
                ],
            ]);

            $campaign->increment('lifetime_spend', $deduct);
        });
    }

    public function shouldPauseCampaigns(Company $company): bool
    {
        $balance = $this->balance($company);

        $minimumActiveDailyBudget = (float) $company->adCampaigns()
            ->where('status', AdCampaignStatus::Active)
            ->min('daily_budget');

        if ($minimumActiveDailyBudget <= 0) {
            return false;
        }

        return $balance < $minimumActiveDailyBudget;
    }
}
