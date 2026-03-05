<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\CompanyTeam;
use Inertia\Inertia;
use App\Http\Requests\UpdateCompanyTeamRequest; // Ensure you import the request class

class TeamController extends Controller
{
  /**
   * Display a listing of the resource.
   */
  public function index(Company $company)
  {
    $members = $company->teams()->get();
    $invitations = $company->invitations()->get();
    return Inertia::render('companies/dashboard/teams/index', [
      'members' => $members,
      'invitations' => $invitations,
    ]);
  }

  /**
   * Update the specified resource in storage.
   */
  public function update(UpdateCompanyTeamRequest $request, Company $company, CompanyTeam $member)
  {
    $member->update($request->validated());
    return back();
  }

  /**
   * Remove the specified resource from storage.
   */
  public function destroy(Company $company, CompanyTeam $member)
  {
    $member->delete();
    return back();
  }
}
