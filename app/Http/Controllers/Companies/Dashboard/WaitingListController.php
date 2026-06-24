<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Enums\CompanyType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Companies\WaitingListIndexRequest;
use App\Models\Company;
use App\Models\TourWaitingList;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class WaitingListController extends Controller
{
    public function index(Company $company, WaitingListIndexRequest $request)
    {
        Gate::authorize('view', $company);

        $validated = $request->validated();
        $waitingLists = $this->applySorting(
            $this->filteredWaitingListsQuery($company, $validated),
            $validated['sort'] ?? '-created_at',
        )
            ->paginate($validated['per_page'] ?? 10)
            ->withQueryString();

        return Inertia::render('companies/dashboard/waiting-lists/index', [
            'data' => $waitingLists,
        ]);
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
                'vendor:id,name,username',
                'createdByCompany:id,name,username',
                'createdByUser:id,name,username,company_id',
                'customerUser:id,name,username,email,phone,company_id',
                'customerUser.company:id,name,username',
                'schedules' => fn ($query) => $query
                    ->with('tourSchedule:id,departure_date,return_date')
                    ->orderByDesc('is_priority')
                    ->orderBy('preference_order'),
            ])
            ->when($companyType === CompanyType::VENDOR->value, function (Builder $query) use ($company): void {
                $query->where('vendor_id', $company->id);
            })
            ->when($companyType === CompanyType::AGENT->value, function (Builder $query) use ($company): void {
                $query->where(function (Builder $innerQuery) use ($company): void {
                    $innerQuery
                        ->where('created_by_company_id', $company->id)
                        ->orWhereHas('customerUser', function (Builder $customerQuery) use ($company): void {
                            $customerQuery->where('company_id', $company->id);
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
