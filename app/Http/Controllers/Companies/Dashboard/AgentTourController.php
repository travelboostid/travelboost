<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\AgentTour;
use App\Models\Company;
use App\Models\VendorAgentPartner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AgentTourController extends Controller
{
    public function index(Company $company, Request $request)
    {
        $status = $request->input('status', 'all');

        $tours = $company->agentTours()
            ->with([
                'tour.company.companySetting',
                'tour.category',
                'tour.image',
                'tour.document',
                'tour.availabilities.schedule',
                'tour.schedules.availability',
                'tour.schedules.prices.priceCategory',
                'category',
                'agentDocument',
            ])
            ->when($status !== 'all', function ($query) use ($status) {
                return $query->where('status', $status);
            })
            ->orderBy('id', 'desc')
            ->get();

        $vendorIds = $tours
            ->pluck('tour.company_id')
            ->filter()
            ->unique()
            ->values();

        $partnershipPermissions = VendorAgentPartner::query()
            ->where('agent_id', $company->id)
            ->whereIn('vendor_id', $vendorIds)
            ->pluck('agent_itinerary_upload_enabled', 'vendor_id');

        $tours = $tours
            ->each(function (AgentTour $agentTour) use ($partnershipPermissions): void {
                $bookingDeadlineDays = (int) ($agentTour->tour?->company?->companySetting?->booking_deadline ?? 0);
                $agentTour->tour?->schedules?->each(function ($schedule) use ($bookingDeadlineDays): void {
                    $schedule->setAttribute('price', $this->lowestDiscountedSchedulePrice($schedule->prices));
                    $schedule->setAttribute('booking_deadline_days', $bookingDeadlineDays);
                });

                $vendorId = $agentTour->tour?->company_id;
                $agentTour->setAttribute(
                    'agent_itinerary_upload_enabled',
                    (bool) ($partnershipPermissions->get($vendorId) ?? false),
                );
            });

        return Inertia::render('companies/dashboard/agent-tours/index', [
            'data' => $tours,
        ]);
    }

    public function update(Request $request, Company $company, AgentTour $agent_tour)
    {
        $request->validate([
            'category_id' => 'nullable|exists:tour_categories,id',
            'status' => 'nullable|in:active,inactive',
            'agent_document_id' => 'nullable|exists:medias,id',
        ]);

        $data = $request->only(['category_id', 'status', 'agent_document_id']);

        $agent_tour->update($data);

        return back();
    }

    public function destroy(Company $company, AgentTour $agent_tour)
    {
        $hasBookings = DB::table('bookings')
            ->where('tour_id', $agent_tour->tour_id)
            ->where('agent_id', $company->id)
            ->exists();

        if ($hasBookings) {
            return back()->withErrors([
                'delete_error' => 'Cannot remove this tour from your catalog because it has existing bookings. Please cancel or complete bookings first.',
            ]);
        }

        $agent_tour->delete();

        return back();
    }

    private function lowestDiscountedSchedulePrice($prices): float
    {
        return (float) $prices
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
            ->min();
    }
}
