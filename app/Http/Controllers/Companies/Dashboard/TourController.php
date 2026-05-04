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
    $priceCategories = PriceCategory::where('company_id', $company->id)
      ->orderBy('name')
      ->get(['id', 'name']);

    return Inertia::render('companies/dashboard/tours/create', [
      'currencies' => Currency::select('code', 'name')
        ->orderBy('code')
        ->get(),
      'priceCategories' => $priceCategories,
    ]);
  }

  public function store(StoreTourRequest $request, Company $company)
  {
    $data = $request->validated();

    DB::beginTransaction();

    try {
      $tour = $company->tours()->create($data);

      foreach ($request->input('schedules', []) as $schedule) {
        $tour->schedules()->create([
          'departure_date' => $schedule['departure_date'] ?? null,
          'return_date'    => $schedule['return_date'] ?? null,
          'quota'          => $schedule['quota'] ?? 0,
          'tour_code'      => $tour->code,
          'company_id'     => $company->id,
        ]);
      }

      DB::commit();

      return redirect()
        ->route('companies.tours.edit', [
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

    $priceCategories = PriceCategory::where('company_id', $company->id)
      ->orderBy('name')
      ->get(['id', 'name']);

    $addOns = $tour->schedules->mapWithKeys(function ($schedule) {
      return [
        $schedule->id => $schedule->addOns->map(fn($item) => [
          'description' => $item->description,
          'price'       => (float) $item->price,
          'edit_status' => (bool) $item->edit_status,
        ])->values(),
      ];
    });

    return Inertia::render('companies/dashboard/tours/edit', [
      'tour'           => $tour,
      'priceCategories' => $priceCategories,
      'addOnsFromDb'   => $addOns,
    ]);
  }

  public function update(UpdateTourRequest $request, Company $company, Tour $tour)
  {
    if ($request->has('quick_update')) {
      $payload = $request->all();

      if (array_key_exists('status', $payload)) {
        $tour->status = $payload['status'];
      }

      if (array_key_exists('category_id', $payload)) {
        $tour->category_id = $payload['category_id'];
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

      $existingScheduleIds = $tour->schedules()->pluck('id')->toArray();
      $incomingScheduleIds = collect($data['schedules'] ?? [])
        ->pluck('id')
        ->filter()
        ->toArray();

      $schedulesToDelete = array_diff($existingScheduleIds, $incomingScheduleIds);
      if (!empty($schedulesToDelete)) {
        TourSchedule::whereIn('id', $schedulesToDelete)->delete();
      }

      foreach ($data['schedules'] ?? [] as $schedule) {
        $scheduleModel = TourSchedule::updateOrCreate(
          ['id' => $schedule['id'] ?? null],
          [
            'tour_id'        => $tour->id,
            'company_id'     => $company->id,
            'tour_code'      => $tour->code,
            'departure_date' => $schedule['departure_date'],
            'return_date'    => $schedule['return_date'] ?? null,
            'quota'          => (int) ($schedule['quota'] ?? 0),
          ]
        );

        $existingPriceIds = $scheduleModel->prices()->pluck('id')->toArray();
        $incomingPriceIds = collect($schedule['prices'] ?? [])
          ->pluck('id')
          ->filter()
          ->toArray();

        $pricesToDelete = array_diff($existingPriceIds, $incomingPriceIds);
        if (!empty($pricesToDelete)) {
          TourPrice::whereIn('id', $pricesToDelete)->delete();
        }

        foreach ($schedule['prices'] ?? [] as $price) {
          if (empty($price['room_type_id'])) {
            continue;
          }

          $promotionRate  = 0;
          $promotionValue = 0;
          if (($price['promotion']['type'] ?? '') === 'percent') {
            $promotionRate = (float) ($price['promotion']['value'] ?? 0);
          } else {
            $promotionValue = (float) ($price['promotion']['value'] ?? 0);
          }

          $commissionRate  = 0;
          $commissionValue = 0;
          if (($price['commission']['type'] ?? '') === 'percent') {
            $commissionRate = (float) ($price['commission']['value'] ?? 0);
          } else {
            $commissionValue = (float) ($price['commission']['value'] ?? 0);
          }

          TourPrice::updateOrCreate(
            ['id' => $price['id'] ?? null],
            [
              'schedule_id'       => $scheduleModel->id,
              'company_id'        => $company->id,
              'tour_code'         => $tour->code,
              'price_category_id' => $price['room_type_id'],
              'price'             => (int) ($price['price'] ?? 0),
              'currency'          => $data['currency'],
              'promotion_rate'    => $promotionRate,
              'promotion'         => $promotionValue,
              'commission_rate'   => $commissionRate,
              'commission'        => $commissionValue,
            ]
          );
        }
      }

      DB::commit();

      return redirect()->route('companies.tours.edit', [
        'company' => $company->username,
        'tour'    => $tour->id,
      ])->with([
        'success' => true,
        'tab'     => 'availability',
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
