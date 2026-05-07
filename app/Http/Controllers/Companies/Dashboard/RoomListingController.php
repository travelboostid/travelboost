<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Company;
use App\Models\Tour;
use App\Models\TourSchedule;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoomListingController extends Controller
{
  public function index(Company $company, Request $request)
  {
    if (strtolower($company->type->value) !== 'vendor') {
      abort(403, 'Akses Ditolak: Halaman ini khusus untuk Vendor.');
    }

    $tours = Tour::where('company_id', $company->id)
      ->whereHas('bookings', function ($q) use ($company) {
        $q->where('vendor_id', $company->id)
          ->whereNotIn('status', ['cancelled', 'expired', 'refunded']);
      })
      ->select('id', 'name', 'code')
      ->get();

    $tourId = $request->input('tour_id');
    $departureDate = $request->input('departure_date');

    $availableDates = [];
    $roomData = [];

    if ($tourId) {
      $availableDates = TourSchedule::where('tour_id', $tourId)
        ->whereNotNull('start_date')
        ->orderBy('start_date', 'asc')
        ->selectRaw('DATE(start_date) as date')
        ->distinct()
        ->pluck('date');
    }

    if ($tourId && $departureDate) {
      $bookings = Booking::where('vendor_id', $company->id)
        ->where('tour_id', $tourId)
        ->whereDate('departure_date', $departureDate)
        ->whereNotIn('status', ['cancelled', 'expired', 'refunded'])
        ->with(['passengers', 'agent:id,name'])
        ->get();

      foreach ($bookings as $booking) {
        foreach ($booking->passengers as $pax) {
          $roomData[] = [
            'booking_number' => $booking->booking_number,
            'agent_name' => $booking->agent ? $booking->agent->name : 'Direct',
            'contact_phone' => $booking->contact_phone,
            'contact_notes' => $booking->contact_notes,
            'title' => $pax->title,
            'first_name' => $pax->first_name,
            'last_name' => $pax->last_name,
            'gender' => $pax->gender,
            'dob' => $pax->dob ? explode('T', $pax->dob)[0] : null,
            'pob' => $pax->pob,
            'passport_number' => $pax->passport_number,
            'passport_issue_date' => $pax->passport_issue_date ? explode('T', $pax->passport_issue_date)[0] : null,
            'passport_expiry_date' => $pax->passport_expiry_date ? explode('T', $pax->passport_expiry_date)[0] : null,
            'room_type' => $pax->room_type,
            'price_category' => $pax->price_category,
            'visa_number' => $pax->visa_number,
          ];
        }
      }
    }

    return Inertia::render('companies/dashboard/reports/room-listings/index', [
      'tours' => $tours,
      'availableDates' => $availableDates,
      'roomData' => $roomData,
      'filters' => [
        'tour_id' => $tourId,
        'departure_date' => $departureDate,
      ]
    ]);
  }
}
