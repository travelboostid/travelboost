<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\AgentTour;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AgentTourController extends Controller
{
  public function index(Company $company, Request $request)
  {
    $status = $request->input('status', 'all');

    $tours = $company->agentTours()
      ->with([
        'tour.company',
        'tour.category',
        'tour.image',
        'tour.document',
        'tour.availabilities',
        'category'
      ])
      ->when($status !== 'all', function ($query) use ($status) {
        return $query->where('status', $status);
      })
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
      'status'      => 'nullable|in:active,inactive',
    ]);

    $agent_tour->update($request->only(['category_id', 'status']));

    return back();
  }

  public function destroy(Company $company, AgentTour $agent_tour)
  {
    $hasBookings = DB::table('bookings')
      ->where('tour_id', $agent_tour->tour_id)
      ->where('agent_id', $company->id)
      ->exists();

    if ($hasBookings) {
      return back()->withErrors([
        'delete_error' => 'Cannot remove this tour from your catalog because it has existing bookings. Please cancel or complete bookings first.'
      ]);
    }

    $agent_tour->delete();
    return back();
  }
}
