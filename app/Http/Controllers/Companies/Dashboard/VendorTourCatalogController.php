<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Tour;
use App\Models\TourCategory;
use App\Models\VendorAgentPartner;
use Inertia\Inertia;

class VendorTourCatalogController extends Controller
{
    public function index(Company $company, string $username)
    {
        $vendor = Company::where('username', $username)->firstOrFail();

        $agentTourIds = $vendor->agentTours()->pluck('tour_id');

        $toursQuery = Tour::where(function ($query) use ($vendor, $agentTourIds) {
            $query->where('company_id', $vendor->id)
                ->orWhereIn('id', $agentTourIds);
        });

        $categories = TourCategory::where('company_id', $vendor->id)
            ->orderBy('position_no')
            ->get();

        $vendor = Company::where('username', $username)->firstOrFail();

        $tours = $toursQuery
            ->with([
                'company:id,username,name',
                'company.companySetting',
                'category',
                'image',
                'document',
                'schedules.availability',
                'schedules.prices.priceCategory',
            ])
            ->when(request('category'), function ($query, $categoryId) use ($vendor) {
                $query->where(function ($q) use ($categoryId, $vendor) {
                    $q->where('category_id', $categoryId)
                        ->orWhereIn('id', function ($subquery) use ($categoryId, $vendor) {
                            $subquery->select('tour_id')
                                ->from('agent_tours')
                                ->where('company_id', $vendor->id)
                                ->where('category_id', $categoryId);
                        });
                });
            })
            ->when(request('search'), function ($query, $search) {
                $query->where('name', 'ilike', "%{$search}%");
            })
            ->get();
        $agentTours = \App\Models\AgentTour::where('company_id', $vendor->id)
            ->when(request('category'), function ($q, $categoryId) {
                $q->where('category_id', $categoryId);
            })
            ->whereHas('tour', function ($q) {
                $q->where('status', 'active');
            })
            ->with(['tour' => function ($q) {
                $q->where('status', 'active')
                    ->with([
                        'company:id,username,name',
                        'company.companySetting',
                        'category',
                        'image',
                        'document',
                        'schedules.availability',
                        'schedules.prices.priceCategory',
                    ]);
            }])
            ->get()
            ->pluck('tour')
            ->filter();

        $copiedTourIds = $company->agentTours()->pluck('tour_id');

        $tours = $tours
            ->merge($agentTours)
            ->unique('id')
            ->sortByDesc('created_at')
            ->values()
            ->loadMissing([
                'company:id,username,name',
                'company.companySetting',
                'category',
                'image',
                'document',
                'schedules.availability',
                'schedules.prices.priceCategory',
            ])
            ->map(function ($tour) use ($copiedTourIds, $company) {
                $tour->has_copied = $copiedTourIds->contains($tour->id);

                $tour->agent_status = \Illuminate\Support\Facades\DB::table('agent_tours')
                    ->where('tour_id', $tour->id)
                    ->where('company_id', $company->id)
                    ->value('status');

                return $tour;
            });

        $partnership = VendorAgentPartner::where('vendor_id', $vendor->id)
            ->where('agent_id', $company->id)
            ->first();

        return Inertia::render('companies/dashboard/vendor-tours/index', [
            'data' => $tours,
            'filters' => request()->only(['category', 'search']),
            'categories' => $categories,
            'username' => $username,
            'partnership' => $partnership,
            'vendor' => $vendor,
        ]);
    }

    public function copy(Company $company, string $vendor, Tour $tour)
    {
        $vendor = Company::where('username', $vendor)->firstOrFail();

        $company->agentTours()->firstOrCreate(
            ['tour_id' => $tour->id],
            ['status' => 'active']
        );

        return back();
    }

    public function viewBrochure(Company $company, string $username, Tour $tour)
    {
        return Inertia::render('companies/dashboard/vendor-tours/view-brochure', [
            'username' => $username,
            'tour' => $tour,
        ]);
    }

    public function viewPublicBrochure($vendor, $tourId)
    {
        $tour = Tour::with('document')->findOrFail($tourId);

        if (! $tour->document) {
            abort(404);
        }

        $url = $tour->document['data']['url'] ?? null;

        if (! $url) {
            abort(404);
        }

        return redirect($url);
    }
}
