<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Enums\CompanyType;
use App\Enums\VendorAgentPartnerStatus;
use App\Http\Controllers\Controller;
use App\Models\AgentTour;
use App\Models\Company;
use App\Models\Tour;
use App\Models\TourCategory;
use App\Models\TourCommissionAdditionalRule;
use App\Models\TourCommissionRule;
use App\Models\VendorAgentPartner;
use App\Notifications\TourAgentPromotionNotification;
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
                'productCommissionCategory',
                'commissionRules.scheduleAdjustments',
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
        $agentTours = AgentTour::where('company_id', $vendor->id)
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
                        'productCommissionCategory',
                        'commissionRules.scheduleAdjustments',
                        'schedules.availability',
                        'schedules.prices.priceCategory',
                    ]);
            }])
            ->get()
            ->pluck('tour')
            ->filter();

        $copiedAgentTours = $company->agentTours()
            ->with('agentDocument')
            ->orderByRaw('CASE WHEN agent_document_id IS NULL THEN 1 ELSE 0 END')
            ->latest('updated_at')
            ->get()
            ->unique('tour_id')
            ->keyBy('tour_id');
        $copiedTourIds = $copiedAgentTours->keys();
        $globalCommissionRules = TourCommissionRule::query()
            ->where('company_id', $vendor->id)
            ->whereNull('tour_id')
            ->where('is_active', true)
            ->get();
        $additionalCommissionRules = TourCommissionAdditionalRule::query()
            ->where('company_id', $vendor->id)
            ->where('is_active', true)
            ->get();

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
                'productCommissionCategory',
                'commissionRules.scheduleAdjustments',
                'schedules.availability',
                'schedules.prices.priceCategory',
            ])
            ->map(function ($tour) use ($copiedTourIds, $company, $copiedAgentTours, $username, $globalCommissionRules, $additionalCommissionRules) {
                $tour->has_copied = $copiedTourIds->contains($tour->id);
                $bookingDeadlineDays = (int) ($tour->company?->companySetting?->booking_deadline ?? 0);
                $tour->schedules?->each(function ($schedule) use ($bookingDeadlineDays): void {
                    $schedule->setAttribute('price', $this->lowestDiscountedSchedulePrice($schedule->prices));
                    $schedule->setAttribute('booking_deadline_days', $bookingDeadlineDays);
                });

                $copiedAgentTour = $copiedAgentTours->get($tour->id);
                $tour->agent_status = $copiedAgentTour?->status;
                $scheduleIds = $tour->schedules?->pluck('id')->all() ?? [];
                $tour->setRelation(
                    'commissionRules',
                    $globalCommissionRules
                        ->where('product_commission_category_id', $tour->product_commission_category_id)
                        ->values()
                );
                $tour->setAttribute(
                    'additional_commission_rules',
                    $additionalCommissionRules
                        ->filter(function ($rule) use ($tour, $scheduleIds): bool {
                            if ($rule->scope_type === 'category_departure') {
                                return (int) $rule->product_commission_category_id === (int) $tour->product_commission_category_id;
                            }

                            return in_array((int) $rule->tour_schedule_id, $scheduleIds, true);
                        })
                        ->values()
                );

                if (
                    $company->type === CompanyType::AGENT
                    && $company->username === $username
                ) {
                    $agentDocument = $copiedAgentTour?->agentDocument;
                    $vendorDocumentUrl = $tour->document['data']['url'] ?? null;
                    $agentDocumentUrl = $agentDocument['data']['url'] ?? null;

                    if ($agentDocument) {
                        $tour->setRelation('agentDocument', $agentDocument);
                    }

                    $tour->setAttribute('vendor_document_url', $vendorDocumentUrl);
                    $tour->setAttribute('agent_document_url', $agentDocumentUrl);
                    $tour->setAttribute('itinerary_document_url', $agentDocumentUrl ?: $vendorDocumentUrl);
                    $tour->setAttribute('itinerary_document_source', $agentDocumentUrl ? 'agent' : ($vendorDocumentUrl ? 'vendor' : null));
                }

                return $tour;
            });

        $partnership = VendorAgentPartner::where('vendor_id', $vendor->id)
            ->where('agent_id', $company->id)
            ->with('agentTier')
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

    public function notifyAgents(Company $company, Tour $tour)
    {
        abort_unless($company->type === CompanyType::VENDOR, 403);
        abort_unless((int) $tour->company_id === (int) $company->id, 404);

        $agents = $company->agentPartners()
            ->where('status', VendorAgentPartnerStatus::ACTIVE)
            ->with('agent')
            ->get()
            ->pluck('agent')
            ->filter()
            ->unique('id')
            ->values();

        $agents->each(function (Company $agent) use ($tour, $company): void {
            $agent->notify(new TourAgentPromotionNotification($tour, $company));
        });

        return back()->with('success', "{$agents->count()} agent notification(s) sent successfully.");
    }

    public function viewBrochure(Company $company, string $username, Tour $tour)
    {
        if ($company->type === CompanyType::AGENT) {
            $agentTour = $company->agentTours()
                ->with('agentDocument')
                ->where('tour_id', $tour->id)
                ->orderByRaw('CASE WHEN agent_document_id IS NULL THEN 1 ELSE 0 END')
                ->latest('updated_at')
                ->first();

            if ($agentTour?->agentDocument) {
                $tour->setRelation('agentDocument', $agentTour->agentDocument);
                $tour->setRelation('agent_document', $agentTour->agentDocument);
                $tour->setRelation('document', $agentTour->agentDocument);
            }
        }

        return Inertia::render('companies/dashboard/vendor-tours/view-brochure', [
            'username' => $username,
            'tour' => $tour,
        ]);
    }

    public function viewPublicBrochure($vendor, $tourId)
    {
        $tour = Tour::with('document')->findOrFail($tourId);
        $tenant = request()->attributes->get('tenant');

        if ($tenant instanceof Company && $tenant->type === CompanyType::AGENT) {
            $agentTour = $tenant->agentTours()
                ->with('agentDocument')
                ->where('tour_id', $tour->id)
                ->orderByRaw('CASE WHEN agent_document_id IS NULL THEN 1 ELSE 0 END')
                ->latest('updated_at')
                ->first();

            if ($agentTour?->agentDocument) {
                $tour->setRelation('agentDocument', $agentTour->agentDocument);
                $tour->setRelation('agent_document', $agentTour->agentDocument);
                $tour->setRelation('document', $agentTour->agentDocument);
            }
        }

        if (! $tour->document) {
            abort(404);
        }

        $url = $tour->document['data']['url'] ?? null;

        if (! $url) {
            abort(404);
        }

        return redirect($url);
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
