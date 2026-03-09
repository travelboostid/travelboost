<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Companies\AgentIndexRequest;
use App\Http\Requests\Companies\UpdateAgentRegistrationRequest;
use App\Models\Company;
use App\Models\VendorAgentPartner;
use Inertia\Inertia;

class AgentRegistrationController extends Controller
{
  public function index(Company $company, AgentIndexRequest $request)
  {
    $validated = $request->validated();
    $data = $company->agentPartners()
      ->with(['agent'])
      ->when($validated['agent.name'] ?? null, function ($query, $name) {
        $query->whereHas('agent', function ($query) use ($name) {
          $query->where('name', 'ilike', $name . '%');
        });
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
      ->paginate()
      ->withQueryString();

    return Inertia::render('companies/dashboard/agent-registrations/index', [
      'data' => $data,
    ]);
  }

  public function update(UpdateAgentRegistrationRequest $request, Company $company, VendorAgentPartner $agent_registration)
  {
    $validated = $request->validated();
    $agent_registration->update($validated);
    return back();
  }

  /**
   * Remove the specified resource from storage.
   */
  public function destroy(Company $company, VendorAgentPartner $agent_registration)
  {
    $agent_registration->delete(); // Delete the partner
    return back();
  }
}
