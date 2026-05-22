<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\TourAvailability;
use App\Models\TourCategory;
use App\Models\VendorAgentPartner;
use Inertia\Inertia;

class TourController extends Controller
{
    public function index()
    {
        $tenant = request()->attributes->get('tenant');

        $tenant->load([
            'agentTours' => function ($query) {
                $query->where('status', 'active')
                    ->with('tour.company.companySetting');
            },
            'settings',
        ]);

        $tourMap = $tenant->agentTours->mapWithKeys(function ($agentTour) {
            return [$agentTour->tour_id => $agentTour->tour->company_id ?? null];
        })->filter();

        $tourIds = $tourMap->keys();
        $vendorIds = $tourMap->values()->unique();

        $partnerships = VendorAgentPartner::whereIn('vendor_id', $vendorIds)
            ->where('agent_id', $tenant->id)
            ->get()
            ->keyBy('vendor_id');

        $availabilities = TourAvailability::whereIn('tour_id', $tourIds)
            ->with('schedule')
            ->get()
            ->filter(function ($avail) use ($tourMap) {
                return $avail->company_id === $tourMap->get($avail->tour_id);
            })
            ->groupBy('tour_id');

        $tenant->agentTours->each(function ($agentTour) use ($availabilities, $partnerships) {
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
                    'price' => (float) ($agentTour->tour->showprice ?? 0),
                    'agent_price' => 0,
                    'cutoff_date' => $avail->schedule->cutoff_date,
                    'is_active' => (bool) $avail->schedule->is_active,
                    'note' => $avail->schedule->note,
                    'booking_deadline_days' => $deadlineDays,
                ])
                ->values();

            $agentTour->tour->is_liked = request()->user()
              ? $agentTour->tour->likes()->where('user_id', request()->user()->id)->exists()
              : false;

            $statusVal = is_object($agentTour->status) ? $agentTour->status->value : $agentTour->status;
            $agentTour->tour->agent_status = $statusVal;

            $partnership = $partnerships->get($agentTour->tour->company_id);
            $showVendor = $partnership ? (bool) $partnership->show_vendor_name : true;

            $agentTour->tour->show_vendor_name = $showVendor;

            $agentTour->show_vendor_name = $showVendor;
            $agentTour->agent_status = $statusVal;
        });

        $validAgentTours = $tenant->agentTours->filter(function ($at) {
            return $at->tour !== null;
        })->values();

        $categories = TourCategory::where('company_id', $tenant->id)
            ->orderBy('position_no')
            ->get();

        $phone = $tenant->customer_service_phone ?: $tenant->phone;

        return Inertia::render('companies/agent-tours', [
            'data' => $validAgentTours,
            'company' => $tenant,
            'vendor' => $tenant,
            'username' => $tenant->username,
            'categories' => $categories,
            'phone' => $phone,
        ]);
    }
}
