<?php

namespace App\Services;

use App\Enums\VendorAgentPartnerStatus;
use App\Models\Tour;
use App\Models\TourCommissionAdditionalRule;
use App\Models\TourCommissionRule;
use App\Models\TourPrice;
use App\Models\TourSchedule;
use App\Models\VendorAgentPartner;

class AgentCommissionResolver
{
    /**
     * @return array{amount: float, breakdown: array<string, mixed>}
     */
    public function resolve(
        Tour $tour,
        ?TourSchedule $schedule,
        TourPrice $tourPrice,
        float $basePrice,
        ?int $agentId = null,
    ): array {
        if ($agentId === null) {
            return $this->fallback($tourPrice, $basePrice);
        }

        $partner = VendorAgentPartner::query()
            ->where('vendor_id', $tour->company_id)
            ->where('agent_id', $agentId)
            ->where('status', VendorAgentPartnerStatus::ACTIVE->value)
            ->first(['id', 'agent_tier_id']);

        if (! $partner?->agent_tier_id || ! $tour->product_commission_category_id) {
            return $this->fallback($tourPrice, $basePrice);
        }

        $rule = $this->applicableRule($tour, (int) $partner->agent_tier_id);

        if (! $rule) {
            return $this->fallback($tourPrice, $basePrice);
        }

        $baseRuleAmount = $this->commissionComponent(
            (string) $rule->commission_type,
            (float) $rule->commission_value,
            $basePrice,
        );
        $scheduleAdjustmentAmount = $this->scheduleAdjustmentAmount($rule, $schedule, $basePrice);
        $additionalRuleAmount = $this->additionalRuleAmount($tour, $schedule, (int) $partner->agent_tier_id, $basePrice);
        $amount = $baseRuleAmount + $scheduleAdjustmentAmount + $additionalRuleAmount;

        return [
            'amount' => (float) $amount,
            'breakdown' => [
                'source' => 'commission_matrix',
                'partner_id' => $partner->id,
                'agent_tier_id' => (int) $partner->agent_tier_id,
                'product_commission_category_id' => (int) $tour->product_commission_category_id,
                'rule_id' => $rule->id,
                'base_price' => $basePrice,
                'base_rule_amount' => (float) $baseRuleAmount,
                'schedule_adjustment_amount' => (float) $scheduleAdjustmentAmount,
                'additional_rule_amount' => (float) $additionalRuleAmount,
            ],
        ];
    }

    /**
     * @return array{amount: float, breakdown: array<string, mixed>}
     */
    public function fallback(TourPrice $tourPrice, float $basePrice): array
    {
        $commissionRate = (float) ($tourPrice->commission_rate ?? 0);
        if ($commissionRate > 0) {
            $amount = (float) round($basePrice * ($commissionRate / 100));

            return [
                'amount' => $amount,
                'breakdown' => [
                    'source' => 'tour_price_percent',
                    'tour_price_id' => $tourPrice->id,
                    'base_price' => $basePrice,
                    'commission_rate' => $commissionRate,
                    'commission_amount' => $amount,
                ],
            ];
        }

        $fixedCommission = (float) ($tourPrice->commission ?? 0);
        if ($fixedCommission > 0) {
            return [
                'amount' => $fixedCommission,
                'breakdown' => [
                    'source' => 'tour_price_fixed',
                    'tour_price_id' => $tourPrice->id,
                    'base_price' => $basePrice,
                    'commission_amount' => $fixedCommission,
                ],
            ];
        }

        return [
            'amount' => 0.0,
            'breakdown' => [
                'source' => 'none',
                'tour_price_id' => $tourPrice->id,
                'base_price' => $basePrice,
            ],
        ];
    }

    private function applicableRule(Tour $tour, int $agentTierId): ?TourCommissionRule
    {
        return TourCommissionRule::query()
            ->where('company_id', $tour->company_id)
            ->where('agent_tier_id', $agentTierId)
            ->where('product_commission_category_id', $tour->product_commission_category_id)
            ->where('is_active', true)
            ->where(function ($query) use ($tour): void {
                $query->where('tour_id', $tour->id)
                    ->orWhereNull('tour_id');
            })
            ->orderByRaw('CASE WHEN tour_id IS NULL THEN 1 ELSE 0 END')
            ->first();
    }

    private function scheduleAdjustmentAmount(TourCommissionRule $rule, ?TourSchedule $schedule, float $basePrice): float
    {
        if (! $schedule) {
            return 0.0;
        }

        $adjustment = $rule->scheduleAdjustments()
            ->where('tour_schedule_id', $schedule->id)
            ->first();

        if (! $adjustment) {
            return 0.0;
        }

        return $this->commissionComponent(
            (string) $adjustment->commission_type,
            (float) $adjustment->commission_value,
            $basePrice,
        );
    }

    private function additionalRuleAmount(Tour $tour, ?TourSchedule $schedule, int $agentTierId, float $basePrice): float
    {
        if (! $schedule) {
            return 0.0;
        }

        return (float) TourCommissionAdditionalRule::query()
            ->where('company_id', $tour->company_id)
            ->where('agent_tier_id', $agentTierId)
            ->where('is_active', true)
            ->where(function ($query) use ($tour, $schedule): void {
                $query
                    ->where(function ($categoryDeparture) use ($tour, $schedule): void {
                        $categoryDeparture
                            ->where('scope_type', 'category_departure')
                            ->where('product_commission_category_id', $tour->product_commission_category_id)
                            ->whereDate('departure_date', $schedule->departure_date);
                    })
                    ->orWhere(function ($tourSchedule) use ($schedule): void {
                        $tourSchedule
                            ->where('scope_type', 'tour_schedule')
                            ->where('tour_schedule_id', $schedule->id);
                    });
            })
            ->get()
            ->sum(fn (TourCommissionAdditionalRule $rule): float => $this->commissionComponent(
                (string) $rule->commission_type,
                (float) $rule->commission_value,
                $basePrice,
            ));
    }

    private function commissionComponent(string $type, float $value, float $basePrice): float
    {
        if ($value <= 0) {
            return 0.0;
        }

        if ($type === 'percent') {
            return (float) (($basePrice * $value) / 100);
        }

        return $value;
    }
}
