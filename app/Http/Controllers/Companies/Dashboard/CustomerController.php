<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\CompanyMember; // Ensure you import the CompanyMember model
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Requests\UpdateCompanyMemberRequest; // Ensure you import the request class

class CustomerController extends Controller
{
  /**
   * Display a listing of the resource.
   */
  public function index(Company $company)
  {
    $customers = $company->customers()
      ->when(request('name'), function ($query, $search) {
        $query->where('name', 'like', "{$search}%");
      })
      ->when(request('email'), function ($query, $search) {
        $query->where('email', 'like', "{$search}%");
      })
      ->when(request('sort'), function ($query) {
        $sorts = explode(',', request('sort'));
        foreach ($sorts as $sort) {
          if (str_starts_with($sort, '-')) {
            $query->orderBy(substr($sort, 1), 'desc');
          } else {
            $query->orderBy($sort, 'asc');
          }
        }
      })
      ->paginate();

    return Inertia::render('companies/dashboard/customers/index', [
      'data' => $customers,
    ]);
  }

  /**
   * Update the specified resource in storage.
   */
  public function update(UpdateCompanyMemberRequest $request, Company $company, CompanyMember $member)
  {
    $member->update($request->validated());
    return back();
  }
}
