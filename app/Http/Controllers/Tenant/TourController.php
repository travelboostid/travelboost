<?php

namespace App\Http\Controllers\Tenant;

use App\Enums\TourWaitingListStatus;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\TourAvailability;
use App\Models\TourCategory;
use App\Models\TourWaitingListSchedule;
use App\Models\VendorAgentPartner;
use App\Support\DebugPerfLogger;
use Inertia\Inertia;

class TourController extends Controller
{
    public function index()
    {
        $startedAt = microtime(true);
        $stepMs = static function (float $stepStartedAt): int {
            return (int) round((microtime(true) - $stepStartedAt) * 1000);
        };

        $tenant = request()->attributes->get('tenant');

        abort_unless($tenant instanceof Company, 404);

        $stepStartedAt = microtime(true);
        $tenant->load([
            'agentTours' => function ($query) {
                $query->where('status', 'active')
                    ->with([
                        'agentDocument',
                        'tour.company.companySetting',
                        'tour.image',
                        'tour.document',
                    ]);
            },
            'settings',
        ]);
        $loadAgentToursMs = $stepMs($stepStartedAt);

        $tourMap = $tenant->agentTours->mapWithKeys(function ($agentTour) {
            return [$agentTour->tour_id => $agentTour->tour->company_id ?? null];
        })->filter();

        $tourIds = $tourMap->keys();
        $vendorIds = $tourMap->values()->unique();

        $stepStartedAt = microtime(true);
        $partnerships = VendorAgentPartner::whereIn('vendor_id', $vendorIds)
            ->where('agent_id', $tenant->id)
            ->get()
            ->keyBy('vendor_id');
        $partnershipsMs = $stepMs($stepStartedAt);

        $minCutoffDate = now()->toDateString();

        $stepStartedAt = microtime(true);
        $availabilities = TourAvailability::query()
            ->whereIn('tour_id', $tourIds)
            ->whereIn('company_id', $vendorIds)
            ->whereHas('schedule', function ($query) use ($minCutoffDate) {
                $query->where('departure_date', '>=', $minCutoffDate)
                    ->where('is_active', true);
            })
            ->with([
                'schedule' => function ($query) use ($minCutoffDate) {
                    $query->where('departure_date', '>=', $minCutoffDate)
                        ->where('is_active', true)
                        ->with('prices.priceCategory');
                },
            ])
            ->get()
            ->groupBy('tour_id');
        $availabilitiesMs = $stepMs($stepStartedAt);

        $user = request()->user();
        $stepStartedAt = microtime(true);
        $likedTourIds = $user && $tourIds->isNotEmpty()
            ? $user->tourLikes()->whereIn('tour_id', $tourIds)->pluck('tour_id')
            : collect();
        $likesMs = $stepMs($stepStartedAt);

        $stepStartedAt = microtime(true);
        $tenant->agentTours->each(function ($agentTour) use ($availabilities, $likedTourIds, $partnerships) {
            if (! $agentTour->tour) {
                return;
            }

            $tourAvails = $availabilities->get($agentTour->tour_id, collect());

            $deadlineDays = (int) ($agentTour->tour->company?->companySetting?->booking_deadline ?? 0);
            $cutoffDate = now()->addDays($deadlineDays)->toDateString();

            $agentTour->tour->schedules = $tourAvails
                ->filter(fn ($avail) => $avail->schedule !== null)
                ->filter(fn ($avail) => $avail->schedule->departure_date >= $cutoffDate)
                ->map(fn ($avail) => [
                    'id' => $avail->schedule->id,
                    'tour_id' => $avail->schedule->tour_id,
                    'departure_date' => $avail->schedule->departure_date,
                    'return_date' => $avail->schedule->return_date,
                    'quota' => (int) $avail->available,
                    'price' => $this->lowestDiscountedSchedulePrice($avail->schedule->prices),
                    'prices' => $avail->schedule->prices->values(),
                    'agent_price' => 0,
                    'cutoff_date' => $avail->schedule->cutoff_date,
                    'is_active' => (bool) $avail->schedule->is_active,
                    'note' => $avail->schedule->note,
                    'booking_deadline_days' => $deadlineDays,
                ])
                ->values();

            $agentTour->tour->is_liked = $likedTourIds->contains($agentTour->tour_id);

            $statusVal = is_object($agentTour->status) ? $agentTour->status->value : $agentTour->status;
            $agentTour->tour->agent_status = $statusVal;

            $partnership = $partnerships->get($agentTour->tour->company_id);
            $showVendor = $partnership ? (bool) $partnership->show_vendor_name : true;

            $agentTour->tour->show_vendor_name = $showVendor;

            if ($agentTour->agentDocument) {
                $agentTour->tour->setRelation('agentDocument', $agentTour->agentDocument);
                $agentTour->tour->setRelation('agent_document', $agentTour->agentDocument);
                $agentTour->tour->setRelation('document', $agentTour->agentDocument);
            }

            $agentTour->show_vendor_name = $showVendor;
            $agentTour->agent_status = $statusVal;
        });
        $transformMs = $stepMs($stepStartedAt);

        $validAgentTours = $tenant->agentTours->filter(function ($at) {
            return $at->tour !== null;
        })->values();

        $stepStartedAt = microtime(true);
        $categories = TourCategory::where('company_id', $tenant->id)
            ->orderBy('position_no')
            ->get();
        $categoriesMs = $stepMs($stepStartedAt);

        $phone = $tenant->customer_service_phone ?: $tenant->phone;
        $customer = request()->user();
        $activeWaitingListScheduleCount = $customer?->hasRole('user:customer')
            ? TourWaitingListSchedule::query()
                ->whereHas('waitingList', fn ($query) => $query
                    ->where('customer_user_id', $customer->id)
                    ->whereIn('status', TourWaitingListStatus::activeValues()))
                ->count()
            : 0;

        $payload = [
            'data' => $validAgentTours,
            'company' => $tenant,
            'vendor' => $tenant,
            'username' => $tenant->username,
            'categories' => $categories,
            'phone' => $phone,
            'activeWaitingListScheduleCount' => $activeWaitingListScheduleCount,
        ];

        $payloadJson = json_encode($payload) ?: '';
        $metrics = [
            'duration_ms' => (int) round((microtime(true) - $startedAt) * 1000),
            'tour_count' => $validAgentTours->count(),
            'schedule_count' => $validAgentTours->sum(fn ($agentTour) => $agentTour->tour?->schedules?->count() ?? 0),
            'payload_bytes' => strlen($payloadJson),
            'memory_mb' => round(memory_get_peak_usage(true) / 1024 / 1024, 2),
            'load_agent_tours_ms' => $loadAgentToursMs,
            'partnerships_ms' => $partnershipsMs,
            'availabilities_ms' => $availabilitiesMs,
            'likes_ms' => $likesMs,
            'transform_ms' => $transformMs,
            'categories_ms' => $categoriesMs,
        ];

        DebugPerfLogger::log(
            'Tenant/TourController.php:index',
            'tenant tours index completed',
            $metrics,
            'A,B'
        );
        DebugPerfLogger::attachResponseHeaders($metrics);

        return Inertia::render('companies/agent-tours', $payload);
    }

    private function lowestDiscountedSchedulePrice($prices): float
    {
        return (float) ($prices
            ->map(function ($price): float {
                $basePrice = (float) $price->price;
                $promotionRate = (float) ($price->promotion_rate ?? 0);
                $promotion = (float) ($price->promotion ?? 0);

                if ($promotionRate > 0) {
                    return max(0.0, (float) round($basePrice - (($basePrice * $promotionRate) / 100)));
                }

                if ($promotion > 0) {
                    return max(0.0, (float) round($basePrice - $promotion));
                }

                return $basePrice;
            })
            ->filter(fn (float $price): bool => $price > 0)
            ->min() ?? 0);
    }
}
