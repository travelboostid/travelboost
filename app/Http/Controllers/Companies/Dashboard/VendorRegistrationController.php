<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Enums\VendorAgentPartnerStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Companies\StoreVendorRegistrationRequest;
use App\Http\Requests\Companies\VendorRegistrationIndexRequest;
use App\Models\Company;
use App\Models\VendorAgentPartner;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class VendorRegistrationController extends Controller
{
    public function index(Company $company, VendorRegistrationIndexRequest $request)
    {
        $validated = $request->validated();

        $query = $this->filteredVendorPartnersQuery($company, $validated);

        $stats = [
            'total' => (clone $query)->count(),
            'pending' => (clone $query)->where('status', VendorAgentPartnerStatus::PENDING)->count(),
            'active' => (clone $query)->where('status', VendorAgentPartnerStatus::ACTIVE)->count(),
            'rejected' => (clone $query)->where('status', VendorAgentPartnerStatus::REJECTED)->count(),
            'suspended' => (clone $query)->where('status', VendorAgentPartnerStatus::SUSPENDED)->count(),
        ];

        $data = (clone $query)
            ->when($validated['sort'] ?? '-applied_at', function (Builder $query, string $sort): void {
                foreach (explode(',', $sort) as $item) {
                    $direction = str_starts_with($item, '-') ? 'desc' : 'asc';
                    $field = ltrim($item, '-');

                    if ($field === 'vendor_name') {
                        $query
                            ->join('companies as vendor_companies', 'vendor_agent_partners.vendor_id', '=', 'vendor_companies.id')
                            ->orderBy('vendor_companies.name', $direction)
                            ->select('vendor_agent_partners.*');

                        continue;
                    }

                    if (in_array($field, ['id', 'applied_at', 'accepted_at', 'status'], true)) {
                        $query->orderBy($field, $direction);
                    }
                }
            })
            ->paginate($validated['per_page'] ?? 10)
            ->withQueryString();

        return Inertia::render('companies/vendor-registrations/index', [
            'data' => $data,
            'stats' => $stats,
        ]);
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function filteredVendorPartnersQuery(Company $company, array $validated): Builder
    {
        return VendorAgentPartner::query()
            ->where('agent_id', $company->id)
            ->with(['vendor'])
            ->when($validated['vendor_name'] ?? null, function (Builder $query, string $name): void {
                $query->whereHas('vendor', function (Builder $query) use ($name): void {
                    $query->where('name', 'ilike', '%'.$name.'%');
                });
            })
            ->when($validated['vendor_username'] ?? null, function (Builder $query, string $username): void {
                $query->whereHas('vendor', function (Builder $query) use ($username): void {
                    $query->where('username', 'ilike', '%'.$username.'%');
                });
            })
            ->when($validated['status'] ?? null, function (Builder $query, array $status): void {
                $query->whereIn('status', $status);
            })
            ->when($validated['payment_mode'] ?? null, function (Builder $query, array $paymentModes): void {
                $query->whereIn('payment_mode', $paymentModes);
            })
            ->when(array_key_exists('show_vendor_name', $validated) && $validated['show_vendor_name'] !== null, function (Builder $query) use ($validated): void {
                $query->where('show_vendor_name', $validated['show_vendor_name']);
            })
            ->when($validated['applied_at'] ?? null, function (Builder $query, string $appliedAt): void {
                $range = explode(',', $appliedAt);

                if (count($range) === 2) {
                    $from = Carbon::createFromTimestamp((int) $range[0] / 1000);
                    $to = Carbon::createFromTimestamp((int) $range[1] / 1000);
                    $query->whereBetween('applied_at', [$from, $to]);

                    return;
                }

                $date = Carbon::createFromTimestamp((int) $range[0] / 1000);
                $query->whereDate('applied_at', $date);
            });
    }

    public function update(Request $request, Company $company, VendorAgentPartner $vendor_registration)
    {
        $vendor_registration->update($request->only(['show_vendor_name']));

        return back();
    }

    public function destroy(Company $company, VendorAgentPartner $vendor_registration)
    {
        $vendor_registration->delete();

        return back();
    }

    public function register(StoreVendorRegistrationRequest $request, Company $company)
    {
        $validated = $request->validated();
        $vendor = Company::where('id', $validated['vendor_id'])->first();

        VendorAgentPartner::create([
            'agent_id' => $company->id,
            'vendor_id' => $vendor->id,
            'status' => 'pending',
            'applied_at' => now(),
        ]);

        return back();
    }
}
