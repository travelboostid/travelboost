<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Actions\Booking\ExpireBookingReservationsAction;
use App\Events\TourUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTourRequest;
use App\Http\Requests\UpdateTourRequest;
use App\Models\AgentTour;
use App\Models\Company;
use App\Models\Currency;
use App\Models\PriceCategory;
use App\Models\Tour;
use App\Models\TourAddOn;
use App\Notifications\TourStatusChangedNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TourController extends Controller
{
    public function index(Company $company): Response
    {
        $tours = $company->tours()
            ->with('availabilities.schedule')
            ->orderBy('id', 'desc')
            ->get();

        return Inertia::render('companies/dashboard/tours/index', [
            'data' => $tours,
            'bookingDeadlineDays' => (int) ($company->companySetting?->booking_deadline ?? 0),
        ]);
    }

    public function create(Company $company): Response
    {
        return Inertia::render('companies/dashboard/tours/create', [
            'currencies' => Currency::select('code', 'name')
                ->orderBy('code')
                ->get(),
        ]);
    }

    public function store(StoreTourRequest $request, Company $company): RedirectResponse
    {
        $data = $request->validated();

        DB::beginTransaction();

        try {
            $tour = $company->tours()->create($data);

            DB::commit();

            return redirect()
                ->route('companies.dashboard.tours.edit', [
                    'company' => $company->username,
                    'tour' => $tour->id,
                ])
                ->with('tab', 'schedule');
        } catch (\Throwable $e) {
            DB::rollBack();

            return back()->withErrors([
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function edit(Company $company, Tour $tour): Response
    {
        app(ExpireBookingReservationsAction::class)->execute($company, $tour->id);

        $tour->load([
            'schedules.prices',
            'schedules.availability',
            'schedules.addOns',
        ]);

        $addOnsFromDb = TourAddOn::where('company_id', $company->id)
            ->where('tour_id', $tour->id)
            ->get()
            ->groupBy('schedule_id');

        return Inertia::render('companies/dashboard/tours/edit', [
            'tour' => $tour,
            'addOnsFromDb' => $addOnsFromDb,
            'currencies' => Currency::select('code', 'name')
                ->orderBy('code')
                ->get(),
            'priceCategories' => PriceCategory::where('company_id', $company->id)
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function update(UpdateTourRequest $request, Company $company, Tour $tour): RedirectResponse
    {
        if ($request->has('quick_update')) {
            $payload = $request->validated();

            if (array_key_exists('category_id', $payload)) {
                $payload['category_id'] = $payload['category_id'] ?: null;
            }

            $tour->fill($payload);
            $tour->save();

            if ($tour->wasChanged('status')) {
                $this->handleTourStatusChanged($tour);
            }

            return back();
        }

        $data = $request->validated();

        $data['showprice'] = (int) ($data['showprice'] ?? 0);
        $data['promote_price'] = (int) ($data['promote_price'] ?? 0);
        $data['category_id'] = $data['category_id'] ?: null;
        $data['image_id'] = $data['image_id'] ?: null;
        $data['document_id'] = $data['document_id'] ?: null;

        DB::beginTransaction();

        try {
            $tour->update($data);

            if ($tour->wasChanged('status')) {
                $this->handleTourStatusChanged($tour);
            }

            TourUpdated::dispatch($tour);

            DB::commit();

            return redirect()->route('companies.dashboard.tours.edit', [
                'company' => $company->username,
                'tour' => $tour->id,
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

    public function destroy(Company $company, Tour $tour): RedirectResponse
    {
        $hasBookings = DB::table('bookings')
            ->where('tour_id', $tour->id)
            ->exists();

        if ($hasBookings) {
            return back()->withErrors([
                'delete_error' => 'Cannot remove this tour from your catalog because it has existing bookings. Please cancel or complete bookings first.',
            ]);
        }

        $tour->delete();

        return back();
    }

    protected function sendTourStatusNotification(Tour $tour): void
    {
        $agentTours = AgentTour::where('tour_id', $tour->id)->with('company')->get();
        $statusValue = is_object($tour->status) ? $tour->status->value : $tour->status;

        foreach ($agentTours as $agentTour) {
            $agentCompany = $agentTour->company;

            if ($agentCompany) {
                $agentCompany->notify(new TourStatusChangedNotification($tour, $statusValue));
            }
        }
    }

    private function handleTourStatusChanged(Tour $tour): void
    {
        $statusValue = is_object($tour->status) ? $tour->status->value : $tour->status;

        if ($statusValue === 'inactive') {
            AgentTour::where('tour_id', $tour->id)->update(['status' => 'inactive']);
        }

        $this->sendTourStatusNotification($tour);
    }
}
