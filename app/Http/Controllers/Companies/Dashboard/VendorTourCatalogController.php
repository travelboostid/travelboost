<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Enums\CompanyType;
use App\Enums\VendorAgentPartnerStatus;
use App\Http\Controllers\Controller;
use App\Models\AgentTour;
use App\Models\Company;
use App\Models\Tour;
use App\Models\TourCategory;
use App\Models\VendorAgentPartner;
use App\Notifications\TourAgentPromotionNotification;
use App\Support\AgentVendorTourCatalogDetailBuilder;
use App\Support\CompanyPermissionMap;
use App\Support\ResolvesTourScheduleDisplayPrice;
use App\Support\TourCatalogPreload;
use App\Support\VendorTourCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VendorTourCatalogController extends Controller
{
    use ResolvesTourScheduleDisplayPrice;

    public function index(Company $company, string $username, Request $request)
    {
        $this->authorizeCatalogIndex($company, $username, $request);

        $vendor = Company::query()
            ->select(['id', 'username', 'name', 'type'])
            ->where('username', $username)
            ->firstOrFail();

        $context = VendorTourCatalog::context($company, $username);
        $catalogRelations = VendorTourCatalog::catalogRelations(
            $context,
            fn (): array => $this->catalogScheduleRelations(),
        );

        $agentTourIds = $vendor->agentTours()->pluck('tour_id');

        $toursQuery = Tour::where(function ($query) use ($vendor, $agentTourIds) {
            $query->where('company_id', $vendor->id)
                ->orWhereIn('id', $agentTourIds);
        });

        $categories = TourCategory::query()
            ->select(['id', 'name', 'company_id', 'position_no'])
            ->where('company_id', $vendor->id)
            ->orderBy('position_no')
            ->get();

        $tours = $toursQuery
            ->with($catalogRelations)
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
            ->with(['tour' => function ($q) use ($catalogRelations) {
                $q->where('status', 'active')
                    ->with($catalogRelations);
            }])
            ->get()
            ->pluck('tour')
            ->filter();

        $catalogPartnershipPermissions = collect();

        if ($company->type === CompanyType::AGENT) {
            $catalogVendorIds = $tours
                ->pluck('company_id')
                ->merge($agentTours->pluck('company_id'))
                ->filter()
                ->unique()
                ->values();

            $catalogPartnershipPermissions = VendorAgentPartner::query()
                ->where('agent_id', $company->id)
                ->whereIn('vendor_id', $catalogVendorIds)
                ->pluck('agent_itinerary_upload_enabled', 'vendor_id');
        }

        $copiedAgentTours = $this->resolveCopiedAgentTours($company, $context);
        $copiedTourIds = $copiedAgentTours->keys();

        $tours = $tours
            ->merge($agentTours)
            ->unique('id')
            ->sortByDesc('created_at')
            ->values()
            ->loadMissing($catalogRelations)
            ->map(function ($tour) use (
                $copiedTourIds,
                $company,
                $copiedAgentTours,
                $username,
                $catalogPartnershipPermissions,
            ) {
                $tour->has_copied = $copiedTourIds->contains($tour->id);
                $bookingDeadlineDays = (int) ($tour->company?->companySetting?->booking_deadline ?? 0);
                $this->prepareCatalogSchedules($tour, $bookingDeadlineDays);

                $copiedAgentTour = $copiedAgentTours->get($tour->id);
                $tour->agent_status = $copiedAgentTour?->status;

                $tour->unsetRelation('productCommissionCategory');
                $tour->setRelation('commissionRules', collect());
                $tour->setAttribute('additional_commission_rules', collect());

                if (
                    $company->type === CompanyType::AGENT
                    && $company->username !== $username
                ) {
                    $agentDocument = $copiedAgentTour?->agentDocument;
                    $vendorDocumentUrl = data_get($tour->document, 'data.url');
                    $agentDocumentUrl = data_get($agentDocument, 'data.url');
                    $isUploadEnabled = (bool) ($catalogPartnershipPermissions->get($tour->company_id) ?? false);

                    if ($agentDocument) {
                        $tour->setRelation('agentDocument', $agentDocument);
                    }

                    $tour->setAttribute('agent_tour_id', $copiedAgentTour?->id);
                    $tour->setAttribute('agent_itinerary_upload_enabled', $isUploadEnabled);
                    $tour->setAttribute('vendor_document_url', $vendorDocumentUrl);
                    $tour->setAttribute('agent_document_url', $agentDocumentUrl);
                    $tour->setAttribute(
                        'itinerary_document_url',
                        $isUploadEnabled && $agentDocumentUrl ? $agentDocumentUrl : $vendorDocumentUrl,
                    );
                    $tour->setAttribute(
                        'itinerary_document_source',
                        $isUploadEnabled && $agentDocumentUrl ? 'agent' : ($vendorDocumentUrl ? 'vendor' : null),
                    );
                }

                return $tour;
            });

        $partnership = $this->resolvePartnership($company, $vendor, $context);

        $lcpImageUrl = TourCatalogPreload::resolveFirstTourImageUrl($tours);

        return Inertia::render('companies/dashboard/vendor-tours/index', [
            'data' => $tours,
            'filters' => request()->only(['category', 'search']),
            'categories' => $categories,
            'username' => $username,
            'partnership' => $partnership,
            'vendor' => $vendor,
            'lcpImageUrl' => $lcpImageUrl,
        ]);
    }

    public function showTourDetails(Company $company, string $vendor, Tour $tour): JsonResponse
    {
        abort_unless($company->type === CompanyType::AGENT, 403);
        abort_unless(
            auth()->user() && CompanyPermissionMap::userHasScopedPermission(auth()->user(), $company, 'vendor-config.query'),
            403,
        );

        $vendorCompany = Company::query()
            ->select(['id', 'username', 'name', 'type'])
            ->where('username', $vendor)
            ->firstOrFail();

        abort_if($company->username === $vendorCompany->username, 404);

        $this->ensureTourBelongsToVendorCatalog($vendorCompany, $tour);

        $payload = app(AgentVendorTourCatalogDetailBuilder::class)->build($vendorCompany, $tour);

        return response()->json($payload);
    }

    private function ensureTourBelongsToVendorCatalog(Company $vendor, Tour $tour): void
    {
        $agentTourIds = $vendor->agentTours()->pluck('tour_id');

        abort_unless(
            (int) $tour->company_id === (int) $vendor->id || $agentTourIds->contains($tour->id),
            404,
        );
    }

    /**
     * @param  array{
     *     is_own_catalog: bool,
     *     is_agent_viewing_vendor: bool,
     *     needs_agent_metadata: bool,
     * }  $context
     */
    private function resolveCopiedAgentTours(Company $company, array $context)
    {
        if (! $context['needs_agent_metadata']) {
            return collect();
        }

        $query = $company->agentTours()
            ->select(['id', 'company_id', 'tour_id', 'status', 'agent_document_id', 'updated_at'])
            ->orderByRaw('CASE WHEN agent_document_id IS NULL THEN 1 ELSE 0 END')
            ->latest('updated_at');

        if ($context['is_own_catalog']) {
            $query->with('agentDocument');
        }

        return $query
            ->get()
            ->unique('tour_id')
            ->keyBy('tour_id');
    }

    /**
     * @param  array{
     *     is_own_catalog: bool,
     *     is_agent_viewing_vendor: bool,
     *     needs_agent_metadata: bool,
     * }  $context
     */
    private function resolvePartnership(Company $company, Company $vendor, array $context): ?VendorAgentPartner
    {
        $query = VendorAgentPartner::query()
            ->where('vendor_id', $vendor->id)
            ->where('agent_id', $company->id);

        if ($context['is_agent_viewing_vendor']) {
            $query->with('agentTier:id,name');
        }

        return $query->first();
    }

    public function copy(Company $company, string $vendor, Tour $tour)
    {
        abort_unless($company->type === CompanyType::AGENT, 403);
        abort_unless(
            auth()->user() && CompanyPermissionMap::userHasScopedPermission(auth()->user(), $company, 'vendor-config.mutation'),
            403,
        );

        $vendor = Company::where('username', $vendor)->firstOrFail();
        $this->ensureTourBelongsToVendorCatalog($vendor, $tour);

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

    public function viewBrochure(Company $company, string $username, Tour $tour, Request $request)
    {
        $this->authorizeCatalogIndex($company, $username, $request);

        $catalogOwner = Company::query()
            ->select(['id', 'username', 'name', 'type'])
            ->where('username', $username)
            ->firstOrFail();
        $this->ensureTourBelongsToVendorCatalog($catalogOwner, $tour);

        if ($company->type === CompanyType::AGENT) {
            $agentTour = $company->agentTours()
                ->with('agentDocument')
                ->where('tour_id', $tour->id)
                ->orderByRaw('CASE WHEN agent_document_id IS NULL THEN 1 ELSE 0 END')
                ->latest('updated_at')
                ->first();

            $isUploadEnabled = $this->isAgentItineraryUploadEnabled($company, $catalogOwner, $tour);

            if ($isUploadEnabled && $agentTour?->agentDocument) {
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

    private function authorizeCatalogIndex(Company $company, string $username, Request $request): void
    {
        $isOwnCatalog = $company->username === $username;

        if ($company->type === CompanyType::VENDOR) {
            abort_unless($isOwnCatalog, 403);
            abort_unless(
                $request->user()
                    && CompanyPermissionMap::userHasScopedPermission($request->user(), $company, 'tour-management.query'),
                403,
            );

            return;
        }

        abort_unless($company->type === CompanyType::AGENT, 403);

        if ($isOwnCatalog) {
            abort_unless(
                $request->user()
                    && CompanyPermissionMap::userHasScopedPermission($request->user(), $company, 'tour-management.query'),
                403,
            );

            return;
        }

        abort_unless(
            $request->user()
                && CompanyPermissionMap::userHasScopedPermission($request->user(), $company, 'vendor-config.query'),
            403,
        );
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

            $isUploadEnabled = $this->isAgentItineraryUploadEnabled($tenant, $tour->company, $tour);

            if ($isUploadEnabled && $agentTour?->agentDocument) {
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

    private function isAgentItineraryUploadEnabled(Company $agent, ?Company $vendor, Tour $tour): bool
    {
        $vendorId = $vendor?->id ?? $tour->company_id;

        if (! $vendorId) {
            return false;
        }

        return (bool) VendorAgentPartner::query()
            ->where('agent_id', $agent->id)
            ->where('vendor_id', $vendorId)
            ->value('agent_itinerary_upload_enabled');
    }
}
