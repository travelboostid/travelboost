<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Companies\StoreVendorRegistrationRequest;
use App\Http\Requests\Companies\VendorRegistrationIndexRequest;
use App\Models\Company;
use App\Models\VendorAgentPartner;
use Inertia\Inertia;

class VendorRegistrationController extends Controller
{
  public function index(Company $company, VendorRegistrationIndexRequest $request)
  {
    $validated = $request->validated();

    // Fetch vendor partners with optional filtering and sorting
    $data = $company->vendorPartners()
      ->with(['vendor'])
      ->when($validated['vendor.name'] ?? null, function ($query, $name) {
        $query->whereHas('vendor', function ($query) use ($name) {
          $query->where('name', 'ilike', $name . '%');
        });
      })
      ->when(request('sort'), function ($query) {
        $sorts = explode(',', request('sort'));
        foreach ($sorts as $sort) {
          // Handle ascending and descending sort directions
          if (str_starts_with($sort, '-')) {
            $query->orderBy(substr($sort, 1), 'desc');
          } else {
            $query->orderBy($sort, 'asc');
          }
        }
      })
      ->paginate()
      ->withQueryString();

    return Inertia::render('companies/vendor-registrations/index', [
      'data' => $data,
    ]);
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

    // Create partner relationship between agent and vendor
    VendorAgentPartner::create(['agent_id' => $company->id, 'vendor_id' => $vendor->id]);
    return back();
  }
}
