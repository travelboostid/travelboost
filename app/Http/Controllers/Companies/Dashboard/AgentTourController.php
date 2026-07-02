<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\AgentTour;
use App\Models\Company;
use App\Models\TourAvailability;
use App\Models\VendorAgentPartner;
use App\Services\AgentPackageAccessService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class AgentTourController extends Controller
{
    public function __construct(
        private readonly AgentPackageAccessService $agentPackageAccessService,
    ) {}

    public function index(Company $company, Request $request)
    {
        $status = $request->input('status', 'all');
        $isPackageOneAgentBlockedByDefault = $this->agentPackageAccessService->isActivePackageOneAgent($company);

        $tours = $company->agentTours()
            ->without(['company'])
            ->select([
                'id',
                'company_id',
                'tour_id',
                'category_id',
                'status',
                'agent_document_id',
                'created_at',
            ])
            ->with([
                'tour' => function ($query): void {
                    $query
                        ->without(['image', 'document', 'category', 'company'])
                        ->select([
                            'id',
                            'company_id',
                            'category_id',
                            'code',
                            'name',
                            'description',
                            'duration_days',
                            'status',
                            'destination',
                            'image_id',
                            'document_id',
                        ])
                        ->with([
                            'company:id,username,name',
                            'category:id,name',
                            'image:id,name,file_name,data',
                            'document:id,name,file_name,data',
                        ]);
                },
                'category',
                'agentDocument:id,name,file_name,data',
            ])
            ->when($status !== 'all', function ($query) use ($status) {
                return $query->where('status', $status);
            })
            ->orderBy('id', 'desc')
            ->get();

        $activeSeatsByTourId = $this->resolveActiveSeatsByTourId($tours);

        $vendorIds = $tours
            ->pluck('tour.company_id')
            ->filter()
            ->unique()
            ->values();

        $partnershipPermissions = VendorAgentPartner::query()
            ->where('agent_id', $company->id)
            ->whereIn('vendor_id', $vendorIds)
            ->pluck('agent_itinerary_upload_enabled', 'vendor_id');

        $categories = $company->tourCategories()
            ->select(['id', 'name'])
            ->orderBy('name')
            ->get();

        $tours = $tours
            ->map(function (AgentTour $agentTour) use ($activeSeatsByTourId, $partnershipPermissions, $isPackageOneAgentBlockedByDefault): array {
                $vendorId = $agentTour->tour?->company_id;
                $coverImageUrl = $this->resolveMediaImageUrl(data_get($agentTour->tour?->image, 'data'));
                $vendorDocumentUrl = $this->resolveMediaDocumentUrl(data_get($agentTour->tour?->document, 'data'));
                $agentDocumentUrl = $this->resolveMediaDocumentUrl(data_get($agentTour->agentDocument, 'data'));
                $isUploadEnabled = (bool) ($partnershipPermissions->get($vendorId) ?? false);
                $itineraryDocumentSource = $isUploadEnabled && $agentDocumentUrl
                    ? 'agent'
                    : ($vendorDocumentUrl ? 'vendor' : null);

                return $this->serializeAgentTour(
                    $agentTour,
                    [
                        'cover_image_url' => $coverImageUrl,
                        'vendor_document_name' => $this->resolveMediaName($agentTour->tour?->document),
                        'agent_document_name' => $this->resolveMediaName($agentTour->agentDocument),
                        'total_active_seats' => (int) ($activeSeatsByTourId->get((int) $agentTour->tour_id) ?? 0),
                        'agent_itinerary_upload_enabled' => $isUploadEnabled,
                        'vendor_document_url' => $vendorDocumentUrl,
                        'agent_document_url' => $agentDocumentUrl,
                        'itinerary_document_url' => $itineraryDocumentSource === 'agent'
                            ? $agentDocumentUrl
                            : $vendorDocumentUrl,
                        'itinerary_document_source' => $itineraryDocumentSource,
                        'booking_blocked_by_subscription' => $isPackageOneAgentBlockedByDefault
                            && ! (bool) ($agentTour->tour?->company?->allow_package_one_agents ?? false),
                    ],
                );
            })
            ->values();

        return Inertia::render('companies/dashboard/agent-tours/index', [
            'data' => $tours,
            'categories' => $categories,
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

        $agent_tour->loadMissing('category');

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Agent tour updated successfully.',
                'data' => [
                    'id' => $agent_tour->id,
                    'category_id' => $agent_tour->category_id,
                    'category' => $agent_tour->category
                        ? [
                            'id' => $agent_tour->category->id,
                            'name' => $agent_tour->category->name,
                        ]
                        : null,
                    'status' => $agent_tour->status,
                    'agent_document_id' => $agent_tour->agent_document_id,
                ],
            ]);
        }

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

    /**
     * @param  Collection<int, AgentTour>  $agentTours
     * @return Collection<int, int>
     */
    private function resolveActiveSeatsByTourId(Collection $agentTours): Collection
    {
        $tourIds = $agentTours
            ->pluck('tour_id')
            ->filter()
            ->map(fn ($tourId): int => (int) $tourId)
            ->unique()
            ->values();

        if ($tourIds->isEmpty()) {
            return collect();
        }

        $availabilityRows = TourAvailability::query()
            ->select([
                'tour_availabilities.tour_id',
                'tour_availabilities.available',
                'tour_schedules.departure_date',
                'company_settings.booking_deadline',
            ])
            ->join('tour_schedules', 'tour_schedules.id', '=', 'tour_availabilities.schedule_id')
            ->join('tours', 'tours.id', '=', 'tour_availabilities.tour_id')
            ->leftJoin('company_settings', 'company_settings.company_id', '=', 'tours.company_id')
            ->whereIn('tour_availabilities.tour_id', $tourIds)
            ->get();

        $today = Carbon::now()->startOfDay();

        return $availabilityRows
            ->filter(function ($availability) use ($today): bool {
                $deadlineDays = max(0, (int) ($availability->booking_deadline ?? 0));
                $cutoffDate = $today->copy()->addDays($deadlineDays);

                return Carbon::parse($availability->departure_date)
                    ->startOfDay()
                    ->greaterThanOrEqualTo($cutoffDate);
            })
            ->groupBy(fn ($availability): int => (int) $availability->tour_id)
            ->map(fn (Collection $rows): int => (int) $rows->sum('available'));
    }

    /**
     * @param  array<string, mixed>|null  $data
     */
    private function resolveMediaImageUrl(?array $data): ?string
    {
        if (! is_array($data)) {
            return null;
        }

        $files = $data['files'] ?? null;
        if (! is_array($files)) {
            return null;
        }

        foreach (['small', 'medium', 'large', 'original'] as $preferredCode) {
            foreach ($files as $file) {
                if (! is_array($file)) {
                    continue;
                }

                if (($file['code'] ?? null) === $preferredCode && is_string($file['url'] ?? null)) {
                    return $file['url'];
                }
            }
        }

        foreach ($files as $file) {
            if (is_array($file) && is_string($file['url'] ?? null)) {
                return $file['url'];
            }
        }

        return null;
    }

    /**
     * @param  array<string, mixed>|null  $data
     */
    private function resolveMediaDocumentUrl(?array $data): ?string
    {
        return is_string($data['url'] ?? null) ? $data['url'] : null;
    }

    private function resolveMediaName(mixed $media): ?string
    {
        $name = data_get($media, 'name')
            ?? data_get($media, 'file_name')
            ?? data_get($media, 'data.name')
            ?? data_get($media, 'data.file_name')
            ?? data_get($media, 'data.filename');

        return is_string($name) && $name !== '' ? $name : null;
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    private function serializeAgentTour(AgentTour $agentTour, array $attributes): array
    {
        return [
            'id' => (int) $agentTour->id,
            'category_id' => $agentTour->category_id !== null ? (int) $agentTour->category_id : null,
            'category' => $agentTour->category
                ? [
                    'id' => (int) $agentTour->category->id,
                    'name' => $agentTour->category->name,
                ]
                : null,
            'tour' => $this->serializeTour($agentTour, $attributes),
            'status' => $agentTour->status,
            'created_at' => optional($agentTour->created_at)?->toISOString(),
            'agent_document_id' => $agentTour->agent_document_id !== null ? (int) $agentTour->agent_document_id : null,
            'agent_document_name' => $attributes['agent_document_name'],
            'agent_itinerary_upload_enabled' => (bool) $attributes['agent_itinerary_upload_enabled'],
            'vendor_document_url' => $attributes['vendor_document_url'],
            'agent_document_url' => $attributes['agent_document_url'],
            'itinerary_document_url' => $attributes['itinerary_document_url'],
            'itinerary_document_source' => $attributes['itinerary_document_source'],
            'total_active_seats' => (int) $attributes['total_active_seats'],
            'booking_blocked_by_subscription' => (bool) $attributes['booking_blocked_by_subscription'],
        ];
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>|null
     */
    private function serializeTour(AgentTour $agentTour, array $attributes): ?array
    {
        $tour = $agentTour->tour;

        if ($tour === null) {
            return null;
        }

        return [
            'id' => (int) $tour->id,
            'company_id' => (int) $tour->company_id,
            'category_id' => $tour->category_id !== null ? (int) $tour->category_id : null,
            'code' => $tour->code,
            'name' => $tour->name,
            'description' => $tour->description,
            'duration_days' => $tour->duration_days,
            'status' => $tour->status,
            'destination' => $tour->destination,
            'cover_image_url' => $attributes['cover_image_url'],
            'vendor_document_name' => $attributes['vendor_document_name'],
            'company' => $tour->company
                ? [
                    'id' => (int) $tour->company->id,
                    'username' => $tour->company->username,
                    'name' => $tour->company->name,
                    'allow_package_one_agents' => (bool) ($tour->company->allow_package_one_agents ?? false),
                ]
                : null,
            'category' => $tour->category
                ? [
                    'id' => (int) $tour->category->id,
                    'name' => $tour->category->name,
                    'slug' => Str::slug($tour->category->name),
                ]
                : null,
        ];
    }
}
