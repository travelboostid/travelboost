<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Enums\CompanyType;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\TourCommissionAdditionalRule;
use App\Models\TourCommissionRule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TourCommissionRuleController extends Controller
{
    public function index(Request $request, Company $company): Response
    {
        abort_unless($company->type === CompanyType::VENDOR, 403);

        return Inertia::render('companies/dashboard/tour-commission-rules/index', [
            ...$this->pageProps($company),
            'view' => 'base',
        ]);
    }

    public function additional(Company $company): Response
    {
        abort_unless($company->type === CompanyType::VENDOR, 403);

        return Inertia::render('companies/dashboard/tour-commission-rules/index', [
            ...$this->pageProps($company),
            'view' => 'additional',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function pageProps(Company $company): array
    {
        $tours = $company->tours()
            ->with([
                'productCommissionCategory:id,category_name',
                'schedules:id,tour_id,departure_date,return_date',
            ])
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'product_commission_category_id']);

        return [
            'tours' => $tours,
            'agentTiers' => $company->agentTiers()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(),
            'productCommissionCategories' => $company->productCommissionCategories()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('category_name')
                ->get(),
            'rules' => TourCommissionRule::query()
                ->where('company_id', $company->id)
                ->whereNull('tour_id')
                ->get(),
            'additionalRules' => TourCommissionAdditionalRule::query()
                ->where('company_id', $company->id)
                ->with([
                    'tour:id,code,name',
                    'tourSchedule:id,tour_id,departure_date,return_date',
                ])
                ->orderByDesc('created_at')
                ->get(),
        ];
    }

    public function store(Request $request, Company $company): RedirectResponse
    {
        abort_unless($company->type === CompanyType::VENDOR, 403);

        $agentTierIds = $company->agentTiers()->pluck('id')->all();
        $categoryIds = $company->productCommissionCategories()->pluck('id')->all();
        $tourIds = $company->tours()->pluck('id')->all();
        $scheduleIds = DB::table('tour_schedules')
            ->whereIn('tour_id', $tourIds)
            ->pluck('id')
            ->all();

        $data = $request->validate([
            'rule_type' => ['required', Rule::in(['base', 'category_departure', 'tour_schedule'])],
            'agent_tier_id' => ['required', Rule::in($agentTierIds)],
            'product_commission_category_id' => ['nullable', Rule::in($categoryIds)],
            'tour_id' => ['nullable', Rule::in($tourIds)],
            'tour_schedule_id' => ['nullable', Rule::in($scheduleIds)],
            'departure_date' => ['nullable', 'date'],
            'departure_items' => ['nullable', 'array'],
            'departure_items.*.departure_date' => ['required_with:departure_items', 'date'],
            'departure_items.*.commission_type' => ['required_with:departure_items', Rule::in(['percent', 'nominal'])],
            'departure_items.*.commission_value' => ['nullable', 'numeric', 'min:0'],
            'commission_type' => ['nullable', Rule::in(['percent', 'nominal'])],
            'commission_value' => ['nullable', 'numeric', 'min:0'],
            'schedule_items' => ['nullable', 'array'],
            'schedule_items.*.tour_schedule_id' => ['required_with:schedule_items', 'integer', Rule::in($scheduleIds)],
            'schedule_items.*.commission_type' => ['required_with:schedule_items', Rule::in(['percent', 'nominal'])],
            'schedule_items.*.commission_value' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if ($data['rule_type'] === 'base') {
            abort_unless($data['product_commission_category_id'] ?? null, 422);
            abort_unless($data['commission_type'] ?? null, 422);

            TourCommissionRule::query()->updateOrCreate(
                [
                    'company_id' => $company->id,
                    'tour_id' => null,
                    'agent_tier_id' => $data['agent_tier_id'],
                    'product_commission_category_id' => $data['product_commission_category_id'],
                ],
                [
                    'commission_type' => $data['commission_type'],
                    'commission_value' => $data['commission_value'] ?? 0,
                    'is_active' => $data['is_active'] ?? true,
                ]
            );

            return back();
        }

        if ($data['rule_type'] === 'category_departure') {
            abort_unless($data['product_commission_category_id'] ?? null, 422);

            $departureItems = collect($data['departure_items'] ?? []);

            if ($departureItems->isNotEmpty()) {
                DB::transaction(function () use ($company, $data, $departureItems): void {
                    $departureItems->each(function (array $item) use ($company, $data): void {
                        TourCommissionAdditionalRule::query()->updateOrCreate(
                            [
                                'company_id' => $company->id,
                                'agent_tier_id' => $data['agent_tier_id'],
                                'product_commission_category_id' => $data['product_commission_category_id'],
                                'departure_date' => $item['departure_date'],
                                'scope_type' => 'category_departure',
                            ],
                            [
                                'tour_id' => null,
                                'tour_schedule_id' => null,
                                'commission_type' => $item['commission_type'],
                                'commission_value' => $item['commission_value'] ?? 0,
                                'is_active' => $data['is_active'] ?? true,
                            ]
                        );
                    });
                });

                return back();
            }

            abort_unless($data['departure_date'] ?? null, 422);
            abort_unless($data['commission_type'] ?? null, 422);

            TourCommissionAdditionalRule::query()->updateOrCreate(
                [
                    'company_id' => $company->id,
                    'agent_tier_id' => $data['agent_tier_id'],
                    'product_commission_category_id' => $data['product_commission_category_id'],
                    'departure_date' => $data['departure_date'],
                    'scope_type' => 'category_departure',
                ],
                [
                    'tour_id' => null,
                    'tour_schedule_id' => null,
                    'commission_type' => $data['commission_type'],
                    'commission_value' => $data['commission_value'] ?? 0,
                    'is_active' => $data['is_active'] ?? true,
                ]
            );

            return back();
        }

        abort_unless($data['tour_id'] ?? null, 422);

        $scheduleItems = collect($data['schedule_items'] ?? []);

        if ($scheduleItems->isNotEmpty()) {
            $selectedScheduleIds = $scheduleItems->pluck('tour_schedule_id')->all();

            $validSelectedScheduleCount = DB::table('tour_schedules')
                ->where('tour_id', $data['tour_id'])
                ->whereIn('id', $selectedScheduleIds)
                ->count();

            abort_unless($validSelectedScheduleCount === count($selectedScheduleIds), 422);

            DB::transaction(function () use ($company, $data, $scheduleItems): void {
                $scheduleItems->each(function (array $item) use ($company, $data): void {
                    TourCommissionAdditionalRule::query()->updateOrCreate(
                        [
                            'company_id' => $company->id,
                            'agent_tier_id' => $data['agent_tier_id'],
                            'tour_schedule_id' => $item['tour_schedule_id'],
                            'scope_type' => 'tour_schedule',
                        ],
                        [
                            'product_commission_category_id' => null,
                            'tour_id' => $data['tour_id'],
                            'departure_date' => null,
                            'commission_type' => $item['commission_type'],
                            'commission_value' => $item['commission_value'] ?? 0,
                            'is_active' => $data['is_active'] ?? true,
                        ]
                    );
                });
            });

            return back();
        }

        abort_unless($data['tour_schedule_id'] ?? null, 422);
        abort_unless($data['commission_type'] ?? null, 422);

        $scheduleBelongsToTour = DB::table('tour_schedules')
            ->where('id', $data['tour_schedule_id'])
            ->where('tour_id', $data['tour_id'])
            ->exists();

        abort_unless($scheduleBelongsToTour, 422);

        TourCommissionAdditionalRule::query()->updateOrCreate(
            [
                'company_id' => $company->id,
                'agent_tier_id' => $data['agent_tier_id'],
                'tour_schedule_id' => $data['tour_schedule_id'],
                'scope_type' => 'tour_schedule',
            ],
            [
                'product_commission_category_id' => null,
                'tour_id' => $data['tour_id'],
                'departure_date' => null,
                'commission_type' => $data['commission_type'],
                'commission_value' => $data['commission_value'] ?? 0,
                'is_active' => $data['is_active'] ?? true,
            ]
        );

        return back();
    }

    public function updateAdditional(Request $request, Company $company, TourCommissionAdditionalRule $additionalRule): RedirectResponse
    {
        abort_unless($company->type === CompanyType::VENDOR, 403);
        abort_unless($additionalRule->company_id === $company->id, 404);

        $agentTierIds = $company->agentTiers()->pluck('id')->all();
        $categoryIds = $company->productCommissionCategories()->pluck('id')->all();

        $data = $request->validate([
            'agent_tier_id' => ['required', Rule::in($agentTierIds)],
            'product_commission_category_id' => ['nullable', Rule::in($categoryIds)],
            'departure_date' => ['nullable', 'date'],
            'commission_type' => ['required', Rule::in(['percent', 'nominal'])],
            'commission_value' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $values = [
            'agent_tier_id' => $data['agent_tier_id'],
            'commission_type' => $data['commission_type'],
            'commission_value' => $data['commission_value'] ?? 0,
            'is_active' => $data['is_active'] ?? true,
        ];

        if ($additionalRule->scope_type === 'category_departure') {
            abort_unless($data['product_commission_category_id'] ?? null, 422);
            abort_unless($data['departure_date'] ?? null, 422);

            $values['product_commission_category_id'] = $data['product_commission_category_id'];
            $values['departure_date'] = $data['departure_date'];
        }

        $additionalRule->update($values);

        return back();
    }

    public function destroyAdditional(Company $company, TourCommissionAdditionalRule $additionalRule): RedirectResponse
    {
        abort_unless($company->type === CompanyType::VENDOR, 403);
        abort_unless($additionalRule->company_id === $company->id, 404);

        $additionalRule->delete();

        return back();
    }
}
