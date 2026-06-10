<?php

namespace App\Http\Controllers\Admin;

use App\Enums\CompanyType;
use App\Http\Controllers\Admin\Concerns\QueriesAdminCompanies;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkUpdateCompanyRequest;
use App\Http\Requests\Admin\IndexVendorRequest;
use App\Http\Requests\Admin\UpdateCompanyRequest;
use App\Models\Company;
use DB;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VendorController extends Controller
{
    use QueriesAdminCompanies;

    public function index(IndexVendorRequest $request): Response
    {
        $validated = $request->validated();

        $query = Company::query()
            ->where('type', CompanyType::VENDOR)
            ->with(['photo']);

        $this->applyCompanyIndexFilters($query, $validated);

        $data = $query->paginate($validated['per_page'] ?? 10);

        $data->through(fn (Company $company): array => $this->companyListItem($company));

        return Inertia::render('admin/database/vendors/index', [
            'data' => $data,
        ]);
    }

    public function edit(Company $vendor): Response
    {
        abort_unless($vendor->type === CompanyType::VENDOR, 404);

        $vendor->load('photo');

        return Inertia::render('admin/database/vendors/edit', [
            'company' => $this->companyListItem($vendor),
        ]);
    }

    public function update(UpdateCompanyRequest $request, Company $vendor)
    {
        abort_unless($vendor->type === CompanyType::VENDOR, 404);

        $vendor->update($request->validated());

        return back()->with('success', 'Vendor updated successfully.');
    }

    public function bulkUpdate(BulkUpdateCompanyRequest $request)
    {
        $validated = $request->validated();
        $companies = Company::query()
            ->where('type', CompanyType::VENDOR)
            ->whereIn('id', $validated['ids'])
            ->get();

        DB::transaction(function () use ($companies, $validated): void {
            foreach ($companies as $company) {
                $company->update(['note' => $validated['note']]);
            }
        });

        return back()->with('success', 'Vendors updated successfully.');
    }

    public function exportAsCsv(Request $request)
    {
        return $this->exportCompaniesCsv($request, 'vendors.csv');
    }

    public function create()
    {
        //
    }

    public function store(Request $request)
    {
        //
    }

    public function show(string $id)
    {
        //
    }

    public function destroy(string $id)
    {
        //
    }
}
