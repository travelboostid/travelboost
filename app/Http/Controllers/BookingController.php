<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBookingRequest;
use App\Models\Tour;
use App\Services\BookingService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class BookingController extends Controller
{
    /**
     * Show the form for creating a new booking.
     */
    public function create(Tour $tour): Response
    {
        return Inertia::render('tours/bookings/create', [
            'tour' => $tour->load('company'),
        ]);
    }

    /**
     * Store a newly created booking.
     */
    public function store(StoreBookingRequest $request, BookingService $bookingService): RedirectResponse
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
