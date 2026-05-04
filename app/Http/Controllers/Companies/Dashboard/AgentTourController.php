<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\AgentTour;
use App\Models\Company;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AgentTourController extends Controller
{
    public function index(Company $company)
    {
        $tours = $company->agentTours()
            ->with(['tour.company', 'tour.category'])
            ->orderBy('id', 'desc')
            ->get();

        return Inertia::render('companies/dashboard/agent-tours/index', [
            'data' => $tours,
        ]);
    }

    public function update(Request $request, Company $company, AgentTour $agent_tour)
    {
        $request->validate([
            'category_id' => 'nullable|exists:tour_categories,id',
            'status' => 'nullable|in:active,inactive',
        ]);

        $agent_tour->update($request->only(['category_id', 'status']));

        return back();
    }

    public function destroy(Company $company, AgentTour $agent_tour)
    {
        $agent_tour->delete();

        return back();
    }
}
