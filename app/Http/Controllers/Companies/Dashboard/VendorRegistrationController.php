<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCompanyTeamInvitationRequest;
use App\Models\Company;
use App\Models\CompanyTeamInvitation;
use App\Models\User;
use App\Models\VendorAgentPartner;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\AllowedSort;
use Spatie\QueryBuilder\QueryBuilder;

class VendorRegistrationController extends Controller
{

  public function index(Company $company)
  {
    $data = QueryBuilder::for($company->vendorPartners())
      ->with('vendor')
      ->allowedFilters([
        // Mapping your 'ilike' logic to Spatie filters
        AllowedFilter::callback('vendor.name', function ($query, $value) {
          $query->where('name', 'ilike', "{$value}%");
        }),
      ])
      ->allowedSorts([
        'status',
        'created_at',
        // Handling the 'vendor.name' relationship sort
        AllowedSort::callback('vendor.name', function ($query, $descending) {
          $direction = $descending ? 'DESC' : 'ASC';
          $query->join('companies as vendors', 'vendor_agent_partners.vendor_id', '=', 'vendors.id')
            ->orderBy('vendors.name', $direction)
            ->select('vendor_agent_partners.*'); // Avoid ID collisions
        }),
      ])
      ->paginate()
      ->withQueryString();
    return Inertia::render('companies/vendor-registrations/index', [
      'data' => $data,
    ]);
  }

  /**
   * Remove the specified resource from storage.
   */
  public function destroy(Company $company, VendorAgentPartner $vendor_registration)
  {
    $vendor_registration->delete(); // Delete the partner
    return back();
  }
}
