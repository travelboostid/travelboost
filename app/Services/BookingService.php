<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Tour;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class BookingService
{
  /**
   * Finalize a booking: update the existing reserved row with full data,
   * including contact info, passengers, and addons.
   *
   * @throws \Exception
   */
  public function createBooking(array $data, User $user): Booking
  {
    $tour = Tour::findOrFail($data['tour_id']);

    $totalPax = (int) $data['pax_adult'] + (int) $data['pax_child'];
    $derivedBasePrice = $totalPax * (float) ($tour->promote_price ?? 0);

    if ((float) $data['total_price'] < $derivedBasePrice) {
      throw new \Exception('Price validation failed. Please refresh your booking session and try again.');
    }

    return DB::transaction(function () use ($data, $user) {
      $booking = Booking::updateOrCreate(
        [
          'booking_number' => data_get($data, 'booking_number'),
          'user_id' => $user->id,
        ],
        [
          'vendor_id' => data_get($data, 'vendor_id'),
          'agent_id' => data_get($data, 'agent_id'),
          'tour_id' => data_get($data, 'tour_id'),
          'departure_date' => data_get($data, 'departure_date'),
          'pax_adult' => data_get($data, 'pax_adult'),
          'pax_child' => data_get($data, 'pax_child'),
          'pax_infant' => data_get($data, 'pax_infant'),
          'total_price' => data_get($data, 'total_price'),
          'tax_amount' => data_get($data, 'tax_amount'),
          'platform_fee' => data_get($data, 'platform_fee'),
          'commission_amount' => data_get($data, 'commission_amount'),
          'grand_total' => data_get($data, 'grand_total'),
          'contact_name' => data_get($data, 'contact_name'),
          'contact_email' => data_get($data, 'contact_email'),
          'contact_phone' => data_get($data, 'contact_phone'),
          'contact_notes' => data_get($data, 'contact_notes'),
          'status' => BookingStatus::AWAITING_PAYMENT,
        ]
      );


      $booking->passengers()->delete();
      $booking->addons()->delete();

      if (! empty($data['passengers'])) {
        $booking->passengers()->createMany($data['passengers']);

        foreach ($data['passengers'] as $passenger) {
          if (! empty($passenger['save_to_address_book']) && $passenger['save_to_address_book'] == true) {
            $user->savedPassengers()->updateOrCreate(
              [
                'first_name' => $passenger['first_name'],
                'last_name' => data_get($passenger, 'last_name'),
              ],
              [
                'gender' => $passenger['gender'],
                'dob' => data_get($passenger, 'dob'),
                'pob' => data_get($passenger, 'pob'),
                'passport_number' => data_get($passenger, 'passport_number'),
              ]
            );
          }
        }
      }

      if (! empty($data['addons'])) {
        $booking->addons()->createMany($data['addons']);
      }

      Booking::where('user_id', $user->id)
        ->where('tour_id', data_get($data, 'tour_id'))
        ->whereDate('departure_date', data_get($data, 'departure_date'))
        ->where('status', BookingStatus::RESERVED)
        ->where('id', '!=', $booking->id)
        ->delete();

      return $booking;
    });
  }
}
