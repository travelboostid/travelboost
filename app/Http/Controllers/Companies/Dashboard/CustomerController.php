<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateCompanyTeamRequest;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\User;
use Inertia\Inertia;

class CustomerController extends Controller
{
    // Display a list of customers for the given company
    public function index(Company $company)
    {
        $agentIds = $company->agentPartners()
            ->where('status', 'active')
            ->pluck('agent_id');

        $customers = User::where(function ($query) use ($company, $agentIds) {
            $query->where('company_id', $company->id)
                ->when($agentIds->isNotEmpty(), function ($q) use ($agentIds) {
                    $q->orWhereIn('company_id', $agentIds);
                });
        })
          // Filter by name if provided
            ->when(request('name'), function ($query, $search) {
                $query->where('name', 'ilike', "{$search}%");
            })
          // Filter by email if provided
            ->when(request('email'), function ($query, $search) {
                $query->where('email', 'ilike', "{$search}%");
            })
          // Sort results based on provided sort parameters
            ->when(request('sort'), function ($query) {
                $sorts = explode(',', request('sort'));
                foreach ($sorts as $sort) {
                    // Determine sort order based on prefix
                    if (str_starts_with($sort, '-')) {
                        $query->orderBy(substr($sort, 1), 'desc');
                    } else {
                        $query->orderBy($sort, 'asc');
                    }
                }
            })
            ->with('company:id,name')
          // Paginate the results
            ->paginate();

        // Render the customers index view with the data
        return Inertia::render('companies/dashboard/customers/index', [
            'data' => $customers,
        ]);
    }

    // Update a specific company team member's details
    public function update(UpdateCompanyTeamRequest $request, Company $company, CompanyTeam $member)
    {
        $member->update($request->validated()); // Update member with validated data

        return back(); // Redirect back to the previous page
    }
}
