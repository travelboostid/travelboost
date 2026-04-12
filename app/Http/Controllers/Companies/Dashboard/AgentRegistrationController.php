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
  // Display a listing of agent partners for the specified company
  public function index(Company $company, AgentIndexRequest $request)
  {
    $validated = $request->validated(); // Validate incoming request data
    $data = $company->agentPartners()
      ->with(['agent']) // Eager load the associated agent
      ->when($validated['agent.name'] ?? null, function ($query, $name) {
        // Filter by agent name if provided
        $query->whereHas('agent', function ($query) use ($name) {
          $query->where('name', 'ilike', $name . '%'); // Case-insensitive search
        });
      })
      ->when(request('sort'), function ($query) {
        // Sort results based on the provided sort parameters
        $sorts = explode(',', request('sort'));
        foreach ($sorts as $sort) {
          if (str_starts_with($sort, '-')) {
            $query->orderBy(substr($sort, 1), 'desc'); // Descending order
          } else {
            $query->orderBy($sort, 'asc'); // Ascending order
          }
        }
      })
      ->paginate() // Paginate the results
      ->withQueryString(); // Preserve query string for pagination links

    return Inertia::render('companies/dashboard/agent-registrations/index', [
      'data' => $data, // Pass the data to the Inertia view
    ]);
  }

  // Update the specified agent registration
  public function update(UpdateAgentRegistrationRequest $request, Company $company, VendorAgentPartner $agent_registration)
  {
    $validated = $request->validated(); // Validate incoming request data
    $agent_registration->update($validated); // Update the agent registration
    return back(); // Redirect back to the previous page
  }

  /**
   * Remove the specified resource from storage.
   */
  // Delete the specified agent registration
  public function destroy(Company $company, VendorAgentPartner $agent_registration)
  {
    $agent_registration->delete(); // Delete the partner
    return back(); // Redirect back to the previous page
  }
}
