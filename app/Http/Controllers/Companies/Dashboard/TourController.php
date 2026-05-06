<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Events\TourUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTourRequest;
use App\Http\Requests\UpdateTourRequest;
use App\Models\Company;
use App\Models\Currency;
use App\Models\PriceCategory;
use App\Models\Tour;
use App\Models\TourAddOn;
use App\Models\TourAvailability;
use App\Models\TourPrice;
use App\Models\TourSchedule;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TourController extends Controller
{
  public function index(Company $company)
  {
    $tours = $company->tours()->orderBy('id', 'desc')->get();

    return Inertia::render('companies/dashboard/tours/index', [
      'data' => $tours,
    ]);
  }

  public function create(Company $company)
  {
    return Inertia::render('companies/dashboard/tours/create', [
      'currencies' => Currency::select('code', 'name')
        ->orderBy('code')
        ->get(),
    ]);
  }

  public function store(StoreTourRequest $request, Company $company)
  {
    $data = $request->validated();

    DB::beginTransaction();

    try {
      $tour = $company->tours()->create($data);

      DB::commit();

      return redirect()
        ->route('companies.dashboard.tours.edit', [
          'company' => $company->username,
          'tour'    => $tour->id,
        ])
        ->with('tab', 'schedule');
    } catch (\Throwable $e) {
      DB::rollBack();

      return back()->withErrors([
        'error' => $e->getMessage(),
      ]);
    }
  }

  public function edit(Company $company, Tour $tour)
  {
    $tour->load([
        'schedules.prices',
        'schedules.availability',
        'schedules.addOns',
    ]);

    $addOnsFromDb = \App\Models\TourAddOn::where('company_id', $company->id)
        ->where('tour_id', $tour->id)
        ->get()
        ->groupBy('schedule_id');

    return Inertia::render('companies/dashboard/tours/edit', [
      'tour'           => $tour,
      'addOnsFromDb' => $addOnsFromDb, 
      'currencies' => Currency::select('code', 'name')
            ->orderBy('code')
            ->get(),
      'priceCategories' => PriceCategory::where('company_id', $company->id)
            ->orderBy('name')
            ->get(['id', 'name']),
    ]);
  }

  public function update(UpdateTourRequest $request, Company $company, Tour $tour)
  {
    if ($request->has('quick_update')) {
      $payload = $request->all();

      if (array_key_exists('status', $payload)) {
        $tour->status = $payload['status'];
      }

      $tour->save();
      return back();
    }

    $data = $request->validated();

    $data['showprice']    = (int) ($data['showprice'] ?? 0);
    $data['promote_price'] = (int) ($data['promote_price'] ?? 0);
    $data['category_id']  = $data['category_id'] ?: null;
    $data['image_id']     = $data['image_id'] ?: null;
    $data['document_id']  = $data['document_id'] ?: null;

    DB::beginTransaction();

    try {
      $tour->update($data);
      TourUpdated::dispatch($tour);

      DB::commit();

      return redirect()->route('companies.dashboard.tours.edit', [
        'company' => $company->username,
        'tour'    => $tour->id,
      ])->with([
        'success' => true,
        'tab' => request('tab', 'schedule'),
      ]);
    } catch (\Throwable $e) {
      DB::rollBack();

      return back()->withErrors([
        'error' => $e->getMessage(),
      ]);
    }
  }

  public function destroy(Company $company, Tour $tour)
  {
    $tour->delete();

    return back();
  }
}
