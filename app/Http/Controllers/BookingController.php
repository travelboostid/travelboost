<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Http\Requests\StoreBookingRequest;
use App\Models\Booking;
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

    $schedule = null;
    $availableSeats = 0;
    if (request()->query('date')) {
      $schedule = \App\Models\TourSchedule::where('tour_code', $tour->code)
        ->whereDate('departure_date', request()->query('date'))
        ->first();

      if ($schedule) {
        $availability = \App\Models\TourAvailability::where('schedule_id', $schedule->id)
          ->where('tour_id', $tour->id)
          ->first();

        $availableSeats = $availability ? (int) $availability->available : 0;
      }
    }

    return Inertia::render('tours/bookings/create', [
      'tour' => $tour,
      'tourPrices' => TourPrice::with('priceCategory:id,name,description')
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
        ->values(),
      'vendor' => $tour->company,
      'bookingNumber' => $bookingNumberService->generate($agentCode, $tourCode),
      'roomTypes' => [],
      'availability' => $availableSeats,
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
      return back()->with('error', 'Failed to create booking: ' . $e->getMessage());
    }
  }

  /**
   * Reserve a booking (set status to 'reserved' when entering step 2).
   */
  public function reserve(string $username, Tour $tour): RedirectResponse
  {
    $data = request()->validate([
      'tour_id' => ['required', 'exists:tours,id'],
      'departure_date' => ['required', 'date'],
      'pax_adult' => ['required', 'integer', 'min:1'],
      'pax_child' => ['required', 'integer', 'min:0'],
      'pax_infant' => ['required', 'integer', 'min:0'],
      'booking_number' => ['required', 'string'],
    ]);

    Booking::updateOrCreate(
      [
        'booking_number' => $data['booking_number'],
        'user_id' => request()->user()->id,
      ],
      [
        'tour_id' => $data['tour_id'],
        'departure_date' => $data['departure_date'],
        'pax_adult' => $data['pax_adult'],
        'pax_child' => $data['pax_child'],
        'pax_infant' => $data['pax_infant'],
        'status' => BookingStatus::Reserved,
        'vendor_id' => $tour->company_id,
        'total_price' => 0,
        'tax_amount' => 0,
        'platform_fee' => 0,
        'commission_amount' => 0,
        'grand_total' => 0,
      ]
    );

    return back();
  }
}
