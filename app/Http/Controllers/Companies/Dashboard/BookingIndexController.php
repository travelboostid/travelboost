<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateBookingRequest;
use App\Models\Booking;
use App\Models\BookingPassenger;
use App\Models\Company;
use App\Models\TourPrice;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BookingIndexController extends Controller
{
    public function index(Company $company, Request $request): Response
    {
        $bookings = Booking::query()
            ->when($company->type === 'vendor', function ($query) use ($company) {
                $query->where('vendor_id', $company->id);
            })
            ->when($company->type === 'agent', function ($query) use ($company) {
                $query->where('agent_id', $company->id);
            })
            ->when($request->input('booking_number'), function ($query, $search) {
                $query->where('booking_number', 'ilike', "{$search}%");
            })
            ->when($request->input('contact_name'), function ($query, $search) {
                $query->where('contact_name', 'ilike', "{$search}%");
            })
            ->when($request->input('status'), function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->input('sort'), function ($query) {
                $sorts = explode(',', request('sort'));
                foreach ($sorts as $sort) {
                    if (str_starts_with($sort, '-')) {
                        $query->orderBy(substr($sort, 1), 'desc');
                    } else {
                        $query->orderBy($sort, 'asc');
                    }
                }
            }, function ($query) {
                $query->latest();
            })
            ->with([
                'tour:id,name,code',
                'vendor:id,name',
                'agent:id,name',
                'user:id,name',
                'passengers:id,booking_id,price_category',
            ])
            ->paginate();

        $bookings->getCollection()->transform(function ($booking) {
            if (! $booking->commission_amount || $booking->commission_amount == 0) {
                $tour = $booking->tour;
                if ($tour) {
                    $schedule = \App\Models\TourSchedule::where('tour_code', $tour->code)
                        ->whereDate('departure_date', $booking->departure_date)
                        ->first();

                    if ($schedule) {
                        $commission = 0;
                        foreach ($booking->passengers as $passenger) {
                            if ($passenger->price_category) {
                                $price = \App\Models\TourPrice::where('tour_code', $tour->code)
                                    ->where('schedule_id', $schedule->id)
                                    ->whereHas('priceCategory', function ($query) use ($passenger) {
                                        $query->where('name', $passenger->price_category);
                                    })->first();

                                if ($price) {
                                    $commission += (float) $price->commission;
                                }
                            }
                        }
                        $booking->commission_amount = $commission;
                    }
                }
            }

            return $booking;
        });

        return Inertia::render('companies/dashboard/bookings/index', [
            'data' => $bookings,
        ]);
    }

    public function show(Company $company, Booking $booking): Response
    {
        return $this->renderBookingPage($company, $booking, 'companies/dashboard/bookings/show');
    }

    public function edit(Company $company, Booking $booking): Response
    {
        return $this->renderBookingPage($company, $booking, 'companies/dashboard/bookings/edit');
    }

    public function update(Company $company, Booking $booking, UpdateBookingRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $booking->update([
            'contact_name' => $validated['contact_name'],
            'contact_email' => $validated['contact_email'],
            'contact_phone' => $validated['contact_phone'],
            'contact_notes' => $validated['contact_notes'] ?? null,
        ]);

        foreach ($validated['passengers'] as $passengerData) {
            BookingPassenger::where('id', $passengerData['id'])
                ->where('booking_id', $booking->id)
                ->update([
                    'title' => $passengerData['title'] ?? null,
                    'first_name' => $passengerData['first_name'],
                    'last_name' => $passengerData['last_name'] ?? null,
                    'gender' => $passengerData['gender'] ?? null,
                    'dob' => $passengerData['dob'] ?? null,
                    'pob' => $passengerData['pob'] ?? null,
                    'nationality' => $passengerData['nationality'] ?? null,
                    'passport_number' => $passengerData['passport_number'] ?? null,
                    'passport_issue_date' => $passengerData['passport_issue_date'] ?? null,
                    'passport_expiry_date' => $passengerData['passport_expiry_date'] ?? null,
                    'visa_number' => $passengerData['visa_number'] ?? null,
                ]);
        }

        return back()->with('success', 'Booking updated successfully.');
    }

    /**
     * Shared method to load booking data with all required relationships
     * and supplemental data (tourPrices, addOns) for the wizard view.
     */
    private function renderBookingPage(Company $company, Booking $booking, string $page): Response
    {
        $booking->load([
            'tour',
            'tour.company',
            'vendor:id,name,payment_mode,commission',
            'agent:id,name',
            'user:id,name',
            'passengers',
            'rooms',
            'addons',
        ]);

        $tour = $booking->tour;

        $tourPrices = collect();
        $addOns = [];

        if ($tour) {
            $schedule = \App\Models\TourSchedule::where('tour_code', $tour->code)
                ->whereDate('departure_date', $booking->departure_date)
                ->first();

            $tourPrices = TourPrice::with('priceCategory:id,name,description')
                ->where('tour_code', $tour->code)
                ->when($schedule, function ($query) use ($schedule) {
                    $query->where('schedule_id', $schedule->id);
                })
                ->get()
                ->unique('price_category_id')
                ->map(function ($price) {
                    return [
                        'tourPriceId' => $price->id,
                        'categoryName' => $price->priceCategory?->name ?? 'Single',
                        'description' => $price->priceCategory?->description ?? '',
                        'price' => (float) $price->price,
                    ];
                })
                ->values();

            if ($schedule) {
                $addOns = \App\Models\TourAddOn::where('schedule_id', $schedule->id)
                    ->where('tour_id', $tour->id)
                    ->get()
                    ->map(function ($addon) {
                        return [
                            'key' => 'addon_'.$addon->id,
                            'label' => $addon->description,
                            'unitPrice' => (float) $addon->price,
                            'qty' => $addon->edit_status ? 0 : 1,
                            'hasQty' => (bool) $addon->edit_status,
                        ];
                    })
                    ->values()
                    ->toArray();
            }
        }

        return Inertia::render($page, [
            'booking' => $booking,
            'tourPrices' => $tourPrices,
            'addOns' => $addOns,
        ]);
    }
}
