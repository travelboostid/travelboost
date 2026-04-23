<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBookingRequest;
use App\Models\Tour;
use App\Models\TourPrice;
use App\Services\BookingNumberService;
use App\Services\BookingService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class BookingController extends Controller
{
    /**
     * Show the form for creating a new booking.
     */
    public function create(string $username, Tour $tour, BookingNumberService $bookingNumberService): Response
    {
        $tour->load('company');

        $tenant = request()->attributes->get('tenant');
        $agentCode = $tenant?->username ?? 'AGT';
        $tourCode = $tour->code ?? 'TOUR';

        return Inertia::render('tours/bookings/create', [
            'tour' => $tour,
            'tourPrices' => TourPrice::with('priceCategory:id,name,description')
                ->where('tour_code', $tour->code)
                ->when(request()->query('date'), function ($query, $date) use ($tour) {
                    $schedule = \App\Models\TourSchedule::where('tour_code', $tour->code)
                        ->whereDate('departure_date', $date)
                        ->first();

                    if ($schedule) {
                        $query->where('schedule_id', $schedule->id);
                    }
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
                ->values(),
            'vendor' => $tour->company,
            'bookingNumber' => $bookingNumberService->generate($agentCode, $tourCode),
            'roomTypes' => [],
        ]);
    }

    /**
     * Store a newly created booking.
     */
    public function store(string $username, StoreBookingRequest $request, BookingService $bookingService): RedirectResponse
    {
        try {
            $booking = $bookingService->createBooking(
                $request->validated(),
                $request->user()
            );

            return redirect()->route('bookings.index')->with('success', 'Booking successfully created.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to create booking: '.$e->getMessage());
        }
    }
}
