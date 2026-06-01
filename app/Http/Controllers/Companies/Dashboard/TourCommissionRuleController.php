<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Enums\CompanyType;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Tour;
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

        $tours = $company->tours()
            ->with([
                'productCommissionCategory:id,category_name',
                'schedules:id,tour_id,departure_date,return_date',
            ])
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'product_commission_category_id']);

        $requestedTourId = $request->filled('tour_id')
            ? (int) $request->integer('tour_id')
            : null;
        $selectedTour = $tours->firstWhere('id', $requestedTourId);
        $selectedTourId = $selectedTour?->id;

        $rules = $selectedTour
            ? TourCommissionRule::query()
                ->where('tour_id', $selectedTour->id)
                ->when(
                    $selectedTour->product_commission_category_id,
                    fn ($query) => $query->where('product_commission_category_id', $selectedTour->product_commission_category_id)
                )
                ->with([
                    'scheduleAdjustments.schedule:id,tour_id,departure_date,return_date',
                ])
                ->get()
            : collect();

        $productCommissionCategories = $selectedTour?->productCommissionCategory
            ? collect([$selectedTour->productCommissionCategory])
            : $company->productCommissionCategories()
                ->orderBy('sort_order')
                ->orderBy('category_name')
                ->get();

        return Inertia::render('companies/dashboard/tour-commission-rules/index', [
            'tours' => $tours,
            'selectedTourId' => $selectedTourId,
            'selectedTour' => $selectedTour,
            'agentTiers' => $company->agentTiers()
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(),
            'productCommissionCategories' => $productCommissionCategories,
            'rules' => $rules,
        ]);
    }

    public function store(Request $request, Company $company): RedirectResponse
    {
        abort_unless($company->type === CompanyType::VENDOR, 403);

        $tourIds = $company->tours()->pluck('id')->all();
        $agentTierIds = $company->agentTiers()->pluck('id')->all();
        $categoryIds = $company->productCommissionCategories()->pluck('id')->all();

        $data = $request->validate([
            'tour_id' => ['required', Rule::in($tourIds)],
            'agent_tier_id' => ['required', Rule::in($agentTierIds)],
            'product_commission_category_id' => ['required', Rule::in($categoryIds)],
            'commission_type' => ['required', Rule::in(['percent', 'nominal'])],
            'commission_value' => ['nullable', 'numeric', 'min:0'],
            'adjustment_schedule_ids' => ['nullable', 'array'],
            'adjustment_schedule_ids.*' => ['integer'],
            'adjustment_type' => ['nullable', Rule::in(['percent', 'nominal'])],
            'adjustment_value' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $tour = Tour::query()
            ->where('company_id', $company->id)
            ->with('schedules:id,tour_id')
            ->findOrFail($data['tour_id']);

        abort_if(
            $tour->product_commission_category_id
            && $tour->product_commission_category_id !== (int) $data['product_commission_category_id'],
            422
        );

        $allowedScheduleIds = $tour->schedules->pluck('id')->all();
        $scheduleIds = collect($data['adjustment_schedule_ids'] ?? [])
            ->filter(fn (int $scheduleId): bool => in_array($scheduleId, $allowedScheduleIds, true))
            ->values();

        DB::transaction(function () use ($data, $scheduleIds): void {
            $rule = TourCommissionRule::query()->updateOrCreate(
                [
                    'tour_id' => $data['tour_id'],
                    'agent_tier_id' => $data['agent_tier_id'],
                    'product_commission_category_id' => $data['product_commission_category_id'],
                ],
                [
                    'commission_type' => $data['commission_type'],
                    'commission_value' => $data['commission_value'] ?? 0,
                    'is_active' => $data['is_active'] ?? true,
                ]
            );

            $rule->scheduleAdjustments()->delete();

            $adjustmentValue = (float) ($data['adjustment_value'] ?? 0);

            if ($adjustmentValue > 0 && $scheduleIds->isNotEmpty()) {
                $scheduleIds->each(function (int $scheduleId) use ($rule, $data, $adjustmentValue): void {
                    $rule->scheduleAdjustments()->create([
                        'tour_schedule_id' => $scheduleId,
                        'commission_type' => $data['adjustment_type'] ?? 'percent',
                        'commission_value' => $adjustmentValue,
                    ]);
                });
            }
        });

        return back();
    }
}
