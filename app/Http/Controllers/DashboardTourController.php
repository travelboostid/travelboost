<?php

namespace App\Http\Controllers;

use App\Events\TourCreated;
use App\Events\TourUpdated;
use App\Http\Requests\StoreTourRequest;
use App\Http\Requests\UpdateTourRequest;
use App\Http\Resources\TourResource;
use App\Models\Tour;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Http\RedirectResponse;

class DashboardTourController extends Controller
{
  public function index()
  {
    return Inertia::render('dashboard/tours/index', [
      'data' => TourResource::collection(
        Tour::with(['user', 'category'])
          ->where('user_id', Auth::id())
          ->latest()
          ->get()
      ),
    ]);
  }

  public function create()
  {
    return Inertia::render('dashboard/tours/create');
  }

  public function store(StoreTourRequest $request)
  {
    $tour = Tour::create($request->validated());

    TourCreated::dispatch($tour);

    return back();
  }

  public function edit(Tour $tour)
  {
    return Inertia::render('dashboard/tours/edit', [
      'tour' => $tour,
    ]);
  }

  public function update(UpdateTourRequest $request, Tour $tour)
  {
    $tour->update($request->validated());
    TourUpdated::dispatch($tour);
    return back();
  }

  public function destroy(Tour $tour)
  {
    $tour->delete();
    return back();
  }
}
