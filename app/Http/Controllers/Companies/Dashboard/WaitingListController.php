<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Actions\WaitingList\OfferWaitingListSeatAction;
use App\Actions\WaitingList\ReorderWaitingListQueueAction;
use App\Actions\WaitingList\ResolveWaitingListQueuePositionAction;
use App\Actions\WaitingList\UpdateTourWaitingListStatusAction;
use App\Enums\CompanyType;
use App\Enums\TourWaitingListScheduleStatus;
use App\Enums\TourWaitingListStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Companies\WaitingListIndexRequest;
use App\Models\Company;
use App\Models\TourSchedule;
use App\Models\TourWaitingList;
use App\Models\TourWaitingListSchedule;
use App\Policies\TourWaitingListPolicy;
use App\Support\CompanyPermissionMap;
use App\Support\WaitingListBookingDeadline;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class WaitingListController extends Controller
{
    public function index(Company $company, WaitingListIndexRequest $request): Response
    {
        abort_unless(
            $request->user()
                && CompanyPermissionMap::userHasScopedPermission($request->user(), $company, 'booking.query'),
            403,
        );

        $validated = $request->validated();
        $waitingLists = $this->applySorting(
            $this->filteredWaitingListsQuery($company, $validated),
            $validated['sort'] ?? '-created_at',
        )
            ->paginate($validated['per_page'] ?? 10)
            ->withQueryString()
            ->through(fn (TourWaitingList $waitingList): array => $this->formatWaitingListForIndex($waitingList));

        return Inertia::render('companies/dashboard/waiting-lists/index', [
            'data' => $waitingLists,
            'permissions' => $this->waitingListPermissions($company),
            'filters' => [
                'search' => $validated['search'] ?? '',
            ],
        ]);
    }

    public function showSchedule(Company $company, TourSchedule $schedule): Response
    {
        Gate::authorize('view', $company);
        abort_unless($this->companyCanAccessSchedule($company, $schedule), 404);

        $schedule->loadMissing(['tour:id,code,name,company_id', 'tour.company.companySetting', 'availability']);

        $isPastBookingDeadline = WaitingListBookingDeadline::isPastDeadline($schedule, $schedule->tour);
        $permissions = $this->waitingListPermissions($company);

        $queue = TourWaitingListSchedule::query()
            ->where('tour_schedule_id', $schedule->id)
            ->whereIn('status', TourWaitingListScheduleStatus::activeQueueValues())
            ->with([
                'waitingList.tour:id,code,name',
                'waitingList.customerUser:id,name,email,phone',
                'waitingList.vendor:id,name',
                'booking:id,booking_number,status',
                'tourSchedule:id,departure_date,return_date,tour_id',
            ])
            ->get()
            ->sortBy(function (TourWaitingListSchedule $entry): array {
                if ($entry->status === TourWaitingListScheduleStatus::OFFERED) {
                    return [0, 0, $entry->offered_at?->timestamp ?? 0];
                }

                $position = app(ResolveWaitingListQueuePositionAction::class)->execute($entry) ?? PHP_INT_MAX;

                return [1, $position, $entry->waitingList?->created_at?->timestamp ?? 0];
            })
            ->values()
            ->map(fn (TourWaitingListSchedule $entry): array => $this->formatQueueEntry($entry));

        return Inertia::render('companies/dashboard/waiting-lists/show', [
            'schedule' => [
                'id' => $schedule->id,
                'departure_date' => $schedule->departure_date,
                'return_date' => $schedule->return_date,
                'is_past_booking_deadline' => $isPastBookingDeadline,
                'tour' => $schedule->tour ? [
                    'id' => $schedule->tour->id,
                    'code' => $schedule->tour->code,
                    'name' => $schedule->tour->name,
                ] : null,
                'availability' => $schedule->availability ? [
                    'available' => (int) $schedule->availability->available,
                    'max_pax' => (int) $schedule->availability->max_pax,
                ] : null,
            ],
            'queue' => $queue,
            'permissions' => $permissions,
        ]);
    }

    public function reorderQueue(Request $request, Company $company, TourSchedule $schedule): RedirectResponse
    {
        Gate::authorize('view', $company);
        abort_unless($this->companyCanAccessSchedule($company, $schedule), 404);
        $this->ensureCanManageQueues($company);

        $validated = $request->validate([
            'order' => ['required', 'array', 'min:1'],
            'order.*' => ['integer', 'exists:tour_waiting_list_schedules,id'],
        ]);

        app(ReorderWaitingListQueueAction::class)->execute(
            (int) $schedule->id,
            array_map('intval', $validated['order']),
        );

        return back()->with('success', 'Waiting list queue order updated.');
    }

    public function offerSchedule(
        Company $company,
        TourWaitingList $waitingList,
        TourWaitingListSchedule $schedule,
    ): RedirectResponse {
        Gate::authorize('view', $company);
        $this->ensureCanManageQueues($company);
        $this->ensureCanManageWaitingList($company, $waitingList);
        abort_unless((int) $schedule->tour_waiting_list_id === (int) $waitingList->id, 404);
        $this->ensureCanManageWaitingListSchedule($company, $schedule);

        app(OfferWaitingListSeatAction::class)->execute($schedule);

        return back()->with('success', 'Seat offer sent to customer.');
    }

    public function updateStatus(
        Request $request,
        Company $company,
        TourWaitingList $waitingList,
    ): RedirectResponse {
        Gate::authorize('view', $company);
        $this->ensureCanManageQueues($company);
        $this->ensureCanManageWaitingList($company, $waitingList);

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:contacted,cancelled'],
            'status_note' => ['nullable', 'string', 'max:1000'],
        ]);

        $status = TourWaitingListStatus::from($validated['status']);

        app(UpdateTourWaitingListStatusAction::class)->execute(
            $waitingList,
            $status,
            $validated['status_note'] ?? null,
        );

        return back()->with('success', 'Waiting-list request updated.');
    }

    /**
     * @return array{can_manage_queues: bool}
     */
    private function waitingListPermissions(Company $company): array
    {
        $user = request()->user();

        return [
            'can_manage_queues' => $user !== null
                && app(TourWaitingListPolicy::class)->manageQueues($user, $company),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function formatWaitingListForIndex(TourWaitingList $waitingList): array
    {
        $waitingList->loadMissing([
            'tour.company.companySetting',
            'schedules.tourSchedule:id,departure_date,return_date,tour_id',
        ]);

        $payload = $waitingList->toArray();
        $payload['schedules'] = $waitingList->schedules
            ->map(fn (TourWaitingListSchedule $schedule): array => $this->formatScheduleForIndex($waitingList, $schedule))
            ->values()
            ->all();

        return $payload;
    }

    /**
     * @return array<string, mixed>
     */
    private function formatScheduleForIndex(
        TourWaitingList $waitingList,
        TourWaitingListSchedule $schedule,
    ): array {
        $tourSchedule = $schedule->tourSchedule;
        $isPastBookingDeadline = $tourSchedule
            ? WaitingListBookingDeadline::isPastDeadline($tourSchedule, $waitingList->tour)
            : false;

        return [
            ...$schedule->toArray(),
            'is_past_booking_deadline' => $isPastBookingDeadline,
            'is_manageable' => ! $isPastBookingDeadline
                && in_array($schedule->status?->value, TourWaitingListScheduleStatus::activeQueueValues(), true),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function formatQueueEntry(TourWaitingListSchedule $entry): array
    {
        return [
            'id' => $entry->id,
            'status' => $entry->status?->value,
            'queue_position' => $entry->status === TourWaitingListScheduleStatus::QUEUED
                ? app(ResolveWaitingListQueuePositionAction::class)->execute($entry)
                : null,
            'manual_queue_position' => $entry->manual_queue_position,
            'pax_adult' => $entry->pax_adult,
            'pax_child' => $entry->pax_child,
            'pax_infant' => $entry->pax_infant,
            'offered_at' => $entry->offered_at?->toIso8601String(),
            'offer_expires_at' => $entry->offer_expires_at?->toIso8601String(),
            'waiting_list' => $entry->waitingList ? [
                'id' => $entry->waitingList->id,
                'contact_name' => $entry->waitingList->contact_name,
                'contact_email' => $entry->waitingList->contact_email,
                'contact_phone' => $entry->waitingList->contact_phone,
                'status' => $entry->waitingList->status?->value,
                'created_at' => $entry->waitingList->created_at?->toIso8601String(),
                'customer_user' => $entry->waitingList->customerUser ? [
                    'id' => $entry->waitingList->customerUser->id,
                    'name' => $entry->waitingList->customerUser->name,
                    'email' => $entry->waitingList->customerUser->email,
                ] : null,
                'tour' => $entry->waitingList->tour ? [
                    'id' => $entry->waitingList->tour->id,
                    'code' => $entry->waitingList->tour->code,
                    'name' => $entry->waitingList->tour->name,
                ] : null,
            ] : null,
            'booking' => $entry->booking ? [
                'id' => $entry->booking->id,
                'booking_number' => $entry->booking->booking_number,
                'status' => $entry->booking->status?->value ?? (string) $entry->booking->status,
            ] : null,
        ];
    }

    private function companyCanAccessSchedule(Company $company, TourSchedule $schedule): bool
    {
        $companyType = strtolower($company->type->value ?? $company->type);

        if ($companyType === CompanyType::VENDOR->value) {
            return (int) $schedule->company_id === (int) $company->id;
        }

        if ($companyType === CompanyType::AGENT->value) {
            return TourWaitingListSchedule::query()
                ->where('tour_schedule_id', $schedule->id)
                ->whereHas('waitingList', function (Builder $query) use ($company): void {
                    $query->where(function (Builder $innerQuery) use ($company): void {
                        $innerQuery
                            ->where('created_by_company_id', $company->id)
                            ->orWhere('agent_company_id', $company->id)
                            ->orWhereHas('customerUser', fn (Builder $customerQuery) => $customerQuery
                                ->where('company_id', $company->id));
                    });
                })
                ->exists();
        }

        return false;
    }

    private function ensureCanManageQueues(Company $company): void
    {
        $user = request()->user();

        abort_unless(
            $user && app(TourWaitingListPolicy::class)->manageQueues($user, $company),
            403,
        );
    }

    private function ensureCanManageWaitingList(Company $company, TourWaitingList $waitingList): void
    {
        $user = request()->user();

        abort_unless(
            $user && app(TourWaitingListPolicy::class)->manage($user, $waitingList, $company),
            403,
        );
    }

    private function ensureCanManageWaitingListSchedule(Company $company, TourWaitingListSchedule $schedule): void
    {
        $user = request()->user();

        abort_unless(
            $user && app(TourWaitingListPolicy::class)->manageSchedule($user, $schedule, $company),
            403,
        );
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function filteredWaitingListsQuery(Company $company, array $validated): Builder
    {
        $companyType = strtolower($company->type->value ?? $company->type);

        return TourWaitingList::query()
            ->with([
                'tour:id,code,name,company_id',
                'tour.company.companySetting',
                'vendor:id,name,username',
                'createdByCompany:id,name,username',
                'createdByUser:id,name,username,company_id',
                'customerUser:id,name,username,email,phone,company_id',
                'customerUser.company:id,name,username',
                'schedules' => fn ($query) => $query
                    ->with('tourSchedule:id,departure_date,return_date,tour_id')
                    ->orderBy('preference_order'),
            ])
            ->when($companyType === CompanyType::VENDOR->value, function (Builder $query) use ($company): void {
                $query->where('vendor_id', $company->id);
            })
            ->when($companyType === CompanyType::AGENT->value, function (Builder $query) use ($company): void {
                $query->where(function (Builder $innerQuery) use ($company): void {
                    $innerQuery
                        ->where('created_by_company_id', $company->id)
                        ->orWhere('agent_company_id', $company->id)
                        ->orWhereHas('customerUser', function (Builder $customerQuery) use ($company): void {
                            $customerQuery->where('company_id', $company->id);
                        });
                });
            })
            ->when($validated['search'] ?? null, function (Builder $query, string $search): void {
                $like = '%'.$search.'%';

                $query->where(function (Builder $innerQuery) use ($like): void {
                    $innerQuery
                        ->where('contact_name', 'ilike', $like)
                        ->orWhere('contact_email', 'ilike', $like)
                        ->orWhere('contact_phone', 'ilike', $like)
                        ->orWhereHas('tour', function (Builder $tourQuery) use ($like): void {
                            $tourQuery
                                ->where('name', 'ilike', $like)
                                ->orWhere('code', 'ilike', $like);
                        })
                        ->orWhereHas('vendor', function (Builder $vendorQuery) use ($like): void {
                            $vendorQuery->where('name', 'ilike', $like);
                        })
                        ->orWhereHas('createdByCompany', function (Builder $companyQuery) use ($like): void {
                            $companyQuery->where('name', 'ilike', $like);
                        })
                        ->orWhereHas('customerUser', function (Builder $customerQuery) use ($like): void {
                            $customerQuery
                                ->where('name', 'ilike', $like)
                                ->orWhere('email', 'ilike', $like)
                                ->orWhere('phone', 'ilike', $like);
                        })
                        ->orWhereHas('createdByUser', function (Builder $userQuery) use ($like): void {
                            $userQuery->where('name', 'ilike', $like);
                        });
                });
            })
            ->when($validated['tour_name'] ?? null, function (Builder $query, string $tourName): void {
                $query->whereHas('tour', function (Builder $tourQuery) use ($tourName): void {
                    $tourQuery->where('name', 'ilike', '%'.$tourName.'%');
                });
            })
            ->when($validated['tour_code'] ?? null, function (Builder $query, string $tourCode): void {
                $query->whereHas('tour', function (Builder $tourQuery) use ($tourCode): void {
                    $tourQuery->where('code', 'ilike', '%'.$tourCode.'%');
                });
            })
            ->when($validated['contact_name'] ?? null, function (Builder $query, string $contactName): void {
                $query->where('contact_name', 'ilike', '%'.$contactName.'%');
            })
            ->when($validated['contact_email'] ?? null, function (Builder $query, string $contactEmail): void {
                $query->where('contact_email', 'ilike', '%'.$contactEmail.'%');
            })
            ->when($validated['contact_phone'] ?? null, function (Builder $query, string $contactPhone): void {
                $query->where('contact_phone', 'ilike', '%'.$contactPhone.'%');
            })
            ->when($validated['vendor_name'] ?? null, function (Builder $query, string $vendorName): void {
                $query->whereHas('vendor', function (Builder $vendorQuery) use ($vendorName): void {
                    $vendorQuery->where('name', 'ilike', '%'.$vendorName.'%');
                });
            })
            ->when($validated['requester_name'] ?? null, function (Builder $query, string $requesterName): void {
                $query->where(function (Builder $innerQuery) use ($requesterName): void {
                    $innerQuery
                        ->whereHas('createdByCompany', function (Builder $createdByCompanyQuery) use ($requesterName): void {
                            $createdByCompanyQuery->where('name', 'ilike', '%'.$requesterName.'%');
                        })
                        ->orWhereHas('customerUser', function (Builder $customerQuery) use ($requesterName): void {
                            $customerQuery->where('name', 'ilike', '%'.$requesterName.'%');
                        })
                        ->orWhereHas('createdByUser', function (Builder $createdByUserQuery) use ($requesterName): void {
                            $createdByUserQuery->where('name', 'ilike', '%'.$requesterName.'%');
                        });
                });
            })
            ->when($validated['status'] ?? null, function (Builder $query, array $statuses): void {
                $query->whereIn('status', $statuses);
            })
            ->when($validated['source'] ?? null, function (Builder $query, array $sources): void {
                $query->where(function (Builder $innerQuery) use ($sources): void {
                    $hasDashboard = in_array('dashboard', $sources, true);
                    $hasCustomer = in_array('customer', $sources, true);

                    if ($hasDashboard) {
                        $innerQuery->whereNotNull('created_by_company_id');
                    }

                    if ($hasCustomer) {
                        if ($hasDashboard) {
                            $innerQuery->orWhereNull('created_by_company_id');
                        } else {
                            $innerQuery->whereNull('created_by_company_id');
                        }
                    }
                });
            })
            ->when($validated['created_at'] ?? null, function (Builder $query, string $createdAt): void {
                $range = explode(',', $createdAt);

                if (count($range) === 2) {
                    $from = Carbon::createFromTimestamp((int) $range[0] / 1000);
                    $to = Carbon::createFromTimestamp((int) $range[1] / 1000);
                    $query->whereBetween('created_at', [$from, $to]);

                    return;
                }

                $date = Carbon::createFromTimestamp((int) $range[0] / 1000);
                $query->whereDate('created_at', $date);
            });
    }

    private function applySorting(Builder $query, string $sort): Builder
    {
        foreach (explode(',', $sort) as $item) {
            $direction = str_starts_with($item, '-') ? 'desc' : 'asc';
            $field = ltrim($item, '-');

            if ($field === 'tour_name') {
                $query
                    ->leftJoin('tours as waiting_list_tours', 'tour_waiting_lists.tour_id', '=', 'waiting_list_tours.id')
                    ->orderBy('waiting_list_tours.name', $direction)
                    ->select('tour_waiting_lists.*');

                continue;
            }

            if ($field === 'vendor_name') {
                $query
                    ->leftJoin('companies as waiting_list_vendors', 'tour_waiting_lists.vendor_id', '=', 'waiting_list_vendors.id')
                    ->orderBy('waiting_list_vendors.name', $direction)
                    ->select('tour_waiting_lists.*');

                continue;
            }

            if ($field === 'requester_name') {
                $query
                    ->leftJoin('companies as waiting_list_requester_companies', 'tour_waiting_lists.created_by_company_id', '=', 'waiting_list_requester_companies.id')
                    ->leftJoin('users as waiting_list_customers', 'tour_waiting_lists.customer_user_id', '=', 'waiting_list_customers.id')
                    ->orderByRaw(
                        'COALESCE(waiting_list_requester_companies.name, waiting_list_customers.name, tour_waiting_lists.contact_name) '.$direction
                    )
                    ->select('tour_waiting_lists.*');

                continue;
            }

            if (in_array($field, ['id', 'contact_name', 'contact_email', 'contact_phone', 'status', 'created_at'], true)) {
                $query->orderBy($field, $direction);
            }
        }

        return $query;
    }
}
