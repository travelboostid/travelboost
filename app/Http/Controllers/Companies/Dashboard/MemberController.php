<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\CompanyMember; // Ensure you import the CompanyMember model
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Requests\UpdateCompanyMemberRequest; // Ensure you import the request class

class MemberController extends Controller
{
  /**
   * Display a listing of the resource.
   */
  public function index(Company $company)
  {
    $members = $company->members()->get();
    $invitations = $company->invitations()->get();
    return Inertia::render('companies/dashboard/members/index', [
      'members' => $members,
      'invitations' => $invitations,
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

  /**
   * Remove the specified resource from storage.
   */
  public function destroy(CompanyMember $member, Company $company)
  {
    $member->delete();
    return back();
  }
}
