<?php

namespace App\Support;

use App\Models\Company;
use App\Models\Tour;
use App\Models\TourCommissionAdditionalRule;
use App\Models\TourCommissionRule;
use Illuminate\Support\Collection;

class AgentVendorTourCatalogDetailBuilder
{
    use ResolvesTourScheduleDisplayPrice;

    /**
     * @return array{
     *     product_commission_category_id: int|null,
     *     schedules: mixed,
     *     commission_rules: Collection<int, TourCommissionRule>,
     *     additional_commission_rules: Collection<int, TourCommissionAdditionalRule>,
     * }
     */
    public function build(Company $vendor, Tour $tour): array
    {
        $tour->loadMissing(array_merge(
            ['company.companySetting:company_id,booking_deadline'],
            $this->detailScheduleRelations(),
        ));

        $bookingDeadlineDays = (int) ($tour->company?->companySetting?->booking_deadline ?? 0);
        $this->prepareCatalogSchedules($tour, $bookingDeadlineDays, retainSchedulePrices: true);

        [$commissionRules, $additionalCommissionRules] = $this->resolveCommissionRules($vendor);
        $scheduleIds = $tour->schedules?->pluck('id')->all() ?? [];

        return [
            'product_commission_category_id' => $tour->product_commission_category_id,
            'schedules' => $tour->schedules,
            'commission_rules' => $this->resolveTourCommissionRules($commissionRules, $tour),
            'additional_commission_rules' => $additionalCommissionRules
                ->filter(function (TourCommissionAdditionalRule $rule) use ($tour, $scheduleIds): bool {
                    if ($rule->scope_type === 'category_departure') {
                        return (int) $rule->product_commission_category_id === (int) $tour->product_commission_category_id;
                    }

                    return in_array((int) $rule->tour_schedule_id, $scheduleIds, true);
                })
                ->values(),
        ];
    }

    /**
     * @return array<string, \Closure>
     */
    private function detailScheduleRelations(): array
    {
        $minCutoffDate = now()->toDateString();

        return [
            'schedules' => function ($query) use ($minCutoffDate): void {
                $query
                    ->select(['id', 'tour_id', 'departure_date', 'return_date', 'is_active'])
                    ->where('departure_date', '>=', $minCutoffDate)
                    ->where('is_active', true)
                    ->with([
                        'availability:id,schedule_id,max_pax,available',
                        'prices' => function ($priceQuery): void {
                            $priceQuery
                                ->select([
                                    'id',
                                    'schedule_id',
                                    'price_category_id',
                                    'price',
                                    'promotion',
                                    'promotion_rate',
                                    'commission',
                                    'commission_rate',
                                ])
                                ->with(['priceCategory:id,name']);
                        },
                    ]);
            },
        ];
    }

    /**
     * @return array{0: Collection<int, TourCommissionRule>, 1: Collection<int, TourCommissionAdditionalRule>}
     */
    private function resolveCommissionRules(Company $vendor): array
    {
        $commissionRules = TourCommissionRule::query()
            ->where('company_id', $vendor->id)
            ->where('is_active', true)
            ->with(['scheduleAdjustments:id,tour_commission_rule_id,tour_schedule_id,commission_type,commission_value'])
            ->get([
                'id',
                'company_id',
                'tour_id',
                'agent_tier_id',
                'product_commission_category_id',
                'commission_type',
                'commission_value',
                'is_active',
            ]);

        $additionalCommissionRules = TourCommissionAdditionalRule::query()
            ->where('company_id', $vendor->id)
            ->where('is_active', true)
            ->get([
                'id',
                'company_id',
                'tour_id',
                'agent_tier_id',
                'product_commission_category_id',
                'tour_schedule_id',
                'departure_date',
                'scope_type',
                'commission_type',
                'commission_value',
                'is_active',
            ]);

        return [$commissionRules, $additionalCommissionRules];
    }

    /**
     * @param  Collection<int, TourCommissionRule>  $commissionRules
     * @return Collection<int, TourCommissionRule>
     */
    private function resolveTourCommissionRules(Collection $commissionRules, Tour $tour): Collection
    {
        return $commissionRules
            ->filter(function (TourCommissionRule $rule) use ($tour): bool {
                if ((int) $rule->product_commission_category_id !== (int) $tour->product_commission_category_id) {
                    return false;
                }

                return $rule->tour_id === null || (int) $rule->tour_id === (int) $tour->id;
            })
            ->groupBy('agent_tier_id')
            ->map(function (Collection $rules): TourCommissionRule {
                $tourSpecificRule = $rules->first(fn (TourCommissionRule $rule): bool => $rule->tour_id !== null);

                return $tourSpecificRule ?? $rules->first();
            })
            ->values();
    }
}
