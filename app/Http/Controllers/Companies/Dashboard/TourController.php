<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Events\TourCreated;
use App\Events\TourUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTourRequest;
use App\Http\Requests\UpdateTourRequest;
use App\Http\Resources\TourResource;
use App\Models\Tour;
use App\Models\Company;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

use App\Models\Currency;

use App\Models\PriceCategory;

use App\Models\TourSchedule;
use App\Models\TourPrice;

use Illuminate\Support\Facades\DB;

class TourController extends Controller
{
  public function index(Company $company)
  {
    $tours = $company->tours()->get();
    return Inertia::render('companies/dashboard/tours/index', [
      'data' => $tours,
    ]);
  }

  public function create(Company $company)
  {
    $priceCategories = PriceCategory::where('company_id', $company->id)
        ->orderBy('name')
        ->get(['id', 'name']);

    //return Inertia::render('companies/dashboard/tours/create');
    return Inertia::render('companies/dashboard/tours/create', [
      'currencies' => Currency::select('code', 'name')
          ->orderBy('code')
          ->get(),

      'priceCategories' => $priceCategories,
    ]);
  }

  public function store(StoreTourRequest $request, Company $company)
  {
    //27032026
    //$tour = $company->tours()->create($request->validated());
    //return back();
    
    // 1️⃣ Ambil data valid
    $data = $request->validated();

    // 2️⃣ Simpan MASTER TOUR via relasi company
    $tour = $company->tours()->create($data);

    // 3️⃣ Ambil schedules dari form
    $schedules = $request->input('schedules', []);

    // 4️⃣ Simpan schedules jika ada
    foreach ($schedules as $schedule) {
        $tour->schedules()->create([
            'departure_date' => $schedule['departure_date'] ?? null,
            'return_date'    => $schedule['return_date'] ?? null,
            'quota'          => $schedule['quota'] ?? 0,
        ]);
    }

    // 5️⃣ Redirect / back
    //return back();
    return redirect()
    ->route('company.tours.edit', [
        'company' => $company->username, // ✅ lebih clean URL
        'tour' => $tour->id,
    ])
    ->with('tab', 'schedule');
  }

  public function edit(Company $company, Tour $tour)
  {
    $tour->load([
        'schedules.prices' // 🔥 WAJIB
    ]);

    $priceCategories = PriceCategory::where('company_id', $company->id)
        ->orderBy('name')
        ->get(['id', 'name']);

    return Inertia::render('companies/dashboard/tours/edit', [
      'tour' => $tour,
      'priceCategories' => $priceCategories,
    ]);
  }

  public function update(UpdateTourRequest $request, Company $company, Tour $tour)
  {
    //14042026
    /*$tour->update($request->validated());
    TourUpdated::dispatch($tour);
    return back();*/

    //dd($request->all());
    //dd($request->validated());
    //dd($request->validated()['schedules']);
    /*dd([
      'all' => $request->all(),
      'validated' => $request->validated(),
      'content' => $request->getContent()
    ]);*/

    $data = $request->validated();

    $data['showprice'] = (int) ($data['showprice'] ?? 0);
    $data['promote_price'] = (int) ($data['promote_price'] ?? 0);

    $data['category_id'] = $data['category_id'] ?: null;
    $data['image_id'] = $data['image_id'] ?: null;
    $data['document_id'] = $data['document_id'] ?: null;

    DB::beginTransaction();

    try {
        // ================= UPDATE TOUR =================
        $tour->update($data);

        // ================= RESET SCHEDULE =================
        $tour->schedules()->delete();

        // ================= INSERT SCHEDULE =================

        foreach ($data['schedules'] ?? [] as $schedule) {
            $scheduleModel = $tour->schedules()->create([
                'tour_id' => $tour->id, 
                'company_id' => $company->id, 
                'tour_code' => $tour->code,   

                'departure_date' => $schedule['departure_date'],
                'return_date' => $schedule['return_date'] ?? null,
                'quota' => (int) ($schedule['quota'] ?: 0),
            ]);

            foreach ($schedule['prices'] ?? [] as $price) {

                if (empty($price['room_type_id'])) continue;

                $promotionRate = 0;
                $promotionValue = 0;

                if (($price['promotion']['type'] ?? '') === 'percent') {
                    $promotionRate = (float) ($price['promotion']['value'] ?: 0);
                } else {
                    $promotionValue = (float) ($price['promotion']['value'] ?: 0);
                }

                $commissionRate = 0;
                $commissionValue = 0;

                if (($price['commission']['type'] ?? '') === 'percent') {
                    $commissionRate = (float) ($price['commission']['value'] ?: 0);
                } else {
                    $commissionValue = (float) ($price['commission']['value'] ?: 0);
                }

                $scheduleModel->prices()->create([
                    'schedule_id' => $scheduleModel->id, // optional (auto sebenarnya)

                    'company_id' => $company->id,
                    'tour_code' => $tour->code,
                
                    'price_category_id' => $price['room_type_id'],
                    'price' => (int) ($price['price'] ?: 0),
                    'currency' => $data['currency'],

                    'promotion_rate' => $promotionRate,
                    'promotion' => $promotionValue,

                    'commission_rate' => $commissionRate,
                    'commission' => $commissionValue,
                ]);
            }
        }

        DB::commit();

        return back()->with([
            'success' => true,
            'tab' => 'schedule',
        ]);

    } catch (\Throwable $e) {
        DB::rollBack();

        /*return back()->withErrors([
            'error' => $e->getMessage(),
        ]);*/
        dd($e->getMessage(), $e->getTraceAsString()); 
    }

  }

  public function destroy(Company $company, Tour $tour)
  {
    $tour->delete();
    return back();
  }
}
