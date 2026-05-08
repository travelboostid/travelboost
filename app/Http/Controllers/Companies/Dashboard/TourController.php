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
use App\Notifications\TourStatusChangedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TourController extends Controller
{
  public function index(Company $company, Request $request)
  {
    $status = $request->input('status', 'all');

    $tours = $company->tours()
      ->with(['company', 'category', 'image', 'document', 'availabilities'])
      ->when($status !== 'all', function ($query) use ($status) {
        return $query->where('status', $status);
      })
      ->when($request->input('search'), function ($query, $search) {
        return $query->where(function ($q) use ($search) {
          $q->where('name', 'ilike', "%{$search}%")
            ->orWhereHas('company', function ($sq) use ($search) {
              $sq->where('name', 'ilike', "%{$search}%");
            })
            ->orWhereHas('category', function ($sq) use ($search) {
              $sq->where('name', 'ilike', "%{$search}%");
            });
        });
      })
      ->when($request->input('sort_by'), function ($query, $sortBy) use ($request) {
        $direction = $request->input('sort_dir', 'desc');
        return $query->orderBy($sortBy, $direction);
      }, function ($query) {
        return $query->orderBy('id', 'desc');
      })
      ->get();

    return Inertia::render('companies/dashboard/tours/index', [
      'data' => $tours,
      'filters' => $request->only(['status', 'search', 'sort_by', 'sort_dir']),
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

        if ($payload['status'] === 'inactive') {
          DB::table('agent_tours')
            ->where('tour_id', $tour->id)
            ->update(['status' => 'inactive']);
        }

        foreach ($tour->agents as $agent) {
          $agent->notify(new TourStatusChangedNotification($tour, $payload['status']));
        }
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

      if (isset($data['status'])) {
        if ($data['status'] === 'inactive') {
          DB::table('agent_tours')
            ->where('tour_id', $tour->id)
            ->update(['status' => 'inactive']);
        }

        foreach ($tour->agents as $agent) {
          $agent->notify(new TourStatusChangedNotification($tour, $data['status']));
        }
      }

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
    $hasBookings = DB::table('bookings')->where('tour_id', $tour->id)->exists();

    if ($hasBookings) {
      return back()->withErrors([
        'delete_error' => 'Cannot delete this tour because it has existing bookings. Please cancel or complete bookings first.'
      ]);
    }

    $tour->delete();
    return back();
  }
}
