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
        $companyId = $tenant?->id ?? 0;
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
                    })->values()->toArray();
            } else {
                $addOns = [];
            }
        } else {
            $addOns = [];
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
            'bookingNumber' => $bookingNumberService->generate((string) $companyId),
            'roomTypes' => [],
            'availability' => $availableSeats,
            'addOns' => $addOns,
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
            'vendor_id' => ['nullable', 'exists:companies,id'],
            'agent_id' => ['nullable', 'exists:companies,id'],
            'contact_name' => ['nullable', 'string', 'max:255'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:50'],
            'contact_notes' => ['nullable', 'string', 'max:1000'],
            'total_price' => ['nullable', 'numeric', 'min:0'],
            'tax_amount' => ['nullable', 'numeric', 'min:0'],
            'platform_fee' => ['nullable', 'numeric', 'min:0'],
            'commission_amount' => ['nullable', 'numeric', 'min:0'],
            'grand_total' => ['nullable', 'numeric', 'min:0'],
            'passengers' => ['nullable', 'array'],
            'passengers.*.title' => ['nullable', 'string', 'max:20'],
            'passengers.*.first_name' => ['required_with:passengers', 'string', 'max:255'],
            'passengers.*.last_name' => ['nullable', 'string', 'max:255'],
            'passengers.*.dob' => ['nullable', 'date'],
            'passengers.*.pob' => ['nullable', 'string', 'max:255'],
            'passengers.*.price_category' => ['nullable', 'string'],
            'passengers.*.price_amount' => ['nullable', 'numeric'],
            'passengers.*.room_type' => ['nullable', 'string'],
        ]);

        $totalPax = $data['pax_adult'] + $data['pax_child'];

        \Illuminate\Support\Facades\DB::transaction(function () use ($data, $tour, $totalPax) {
            $booking = Booking::updateOrCreate(
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
                    'status' => BookingStatus::RESERVED,
                    'reserved_type' => 'system',
                    'vendor_id' => $data['vendor_id'] ?? $tour->company_id,
                    'agent_id' => $data['agent_id'] ?? null,
                    'total_price' => $data['total_price'] ?? 0,
                    'tax_amount' => $data['tax_amount'] ?? 0,
                    'platform_fee' => $data['platform_fee'] ?? 0,
                    'commission_amount' => $data['commission_amount'] ?? 0,
                    'grand_total' => $data['grand_total'] ?? 0,
                    'contact_name' => $data['contact_name'] ?? null,
                    'contact_email' => $data['contact_email'] ?? null,
                    'contact_phone' => $data['contact_phone'] ?? null,
                    'contact_notes' => $data['contact_notes'] ?? null,
                ]
            );

            // Save passengers if provided
            if (! empty($data['passengers'])) {
                $booking->passengers()->delete();
                $booking->passengers()->createMany($data['passengers']);
            }

            // Only decrement availability when the booking was just created (not re-reserved)
            if ($booking->wasRecentlyCreated) {
                $schedule = \App\Models\TourSchedule::where('tour_code', $tour->code)
                    ->whereDate('departure_date', $data['departure_date'])
                    ->first();

                if ($schedule) {
                    \App\Models\TourAvailability::where('schedule_id', $schedule->id)
                        ->where('tour_id', $tour->id)
                        ->lockForUpdate()
                        ->first()
                        ?->increment('RS', $totalPax);

                    \App\Models\TourAvailability::where('schedule_id', $schedule->id)
                        ->where('tour_id', $tour->id)
                        ->decrement('available', $totalPax);
                }
            }
        });

        return back();
    }
}
