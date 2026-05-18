<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Enums\UserGender;
use App\Models\Booking;
use App\Models\Tour;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
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

        $paymentMode = $this->resolvePaymentMode(data_get($data, 'payment_method'));

        return DB::transaction(function () use ($data, $user, $paymentMode, $tour) {
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
                    'payment_mode' => $paymentMode,
                    'contact_name' => data_get($data, 'contact_name'),
                    'contact_email' => data_get($data, 'contact_email'),
                    'contact_phone' => data_get($data, 'contact_phone'),
                    'contact_notes' => data_get($data, 'contact_notes'),
                    'status' => BookingStatus::BOOKING_RESERVED,
                ]
            );

            if (! $booking->reserved_expires_at) {
                $booking->update([
                    'reserved_expires_at' => now()->addMinutes($this->resolveBookingTimeLimitMinutes($tour)),
                ]);
            }

            $booking->passengers()->delete();
            $booking->addons()->delete();
            if (array_key_exists('rooms', $data)) {
                $booking->rooms()->delete();
            }

            if (! empty($data['passengers'])) {
                $passengerRows = $this->preparePassengerRows($data['passengers']);

                $booking->passengers()->createMany($passengerRows);
                $this->syncSavedPassengers($user, $passengerRows);
            }

            if (array_key_exists('rooms', $data) && ! empty($data['rooms'])) {
                $booking->rooms()->createMany($data['rooms']);
            }

            if (! empty($data['addons'])) {
                $booking->addons()->createMany($data['addons']);
            }

            Booking::where('user_id', $user->id)
                ->where('tour_id', data_get($data, 'tour_id'))
                ->whereDate('departure_date', data_get($data, 'departure_date'))
                ->whereIn('status', [BookingStatus::RESERVED, BookingStatus::BOOKING_RESERVED])
                ->where('id', '!=', $booking->id)
                ->delete();

            return $booking;
        });
    }

    /**
     * @param  array<int, array<string, mixed>>  $passengers
     * @return array<int, array<string, mixed>>
     */
    private function preparePassengerRows(array $passengers): array
    {
        return collect($passengers)
            ->map(function (array $passenger): array {
                if (($passportFile = data_get($passenger, 'passport_file')) instanceof UploadedFile) {
                    $passenger['passport_file_path'] = $passportFile->store('travel-documents/passports', 'public');
                }

                if (($visaFile = data_get($passenger, 'visa_file')) instanceof UploadedFile) {
                    $passenger['visa_file_path'] = $visaFile->store('travel-documents/visas', 'public');
                }

                return Arr::only($passenger, [
                    'title',
                    'first_name',
                    'last_name',
                    'gender',
                    'dob',
                    'pob',
                    'nationality',
                    'room_type',
                    'room_number',
                    'passport_number',
                    'passport_issue_date',
                    'passport_expiry_date',
                    'visa_number',
                    'passport_file_path',
                    'visa_file_path',
                    'price_category',
                    'price_amount',
                    'note',
                ]);
            })
            ->all();
    }

    /**
     * @param  array<int, array<string, mixed>>  $passengers
     */
    public function syncSavedPassengers(User $user, array $passengers): void
    {
        foreach ($passengers as $passenger) {
            $firstName = trim((string) data_get($passenger, 'first_name'));

            if ($firstName === '') {
                continue;
            }

            $lastName = (string) data_get($passenger, 'last_name', '');

            $user->savedPassengers()->updateOrCreate(
                [
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                ],
                [
                    'title' => data_get($passenger, 'title'),
                    'gender' => data_get($passenger, 'gender') ?: UserGender::UNSPECIFIED->value,
                    'dob' => data_get($passenger, 'dob'),
                    'pob' => data_get($passenger, 'pob'),
                    'passport_number' => data_get($passenger, 'passport_number'),
                    'passport_issue_date' => data_get($passenger, 'passport_issue_date'),
                    'passport_expiry_date' => data_get($passenger, 'passport_expiry_date'),
                    'visa_number' => data_get($passenger, 'visa_number'),
                    'passport_file_path' => data_get($passenger, 'passport_file_path'),
                    'visa_file_path' => data_get($passenger, 'visa_file_path'),
                ]
            );
        }
    }

    private function resolvePaymentMode(?string $paymentMethod): ?string
    {
        return match ($paymentMethod) {
            'manual_transfer', 'bank_transfer' => 'manual',
            'midtrans', 'online' => 'online',
            default => null,
        };
    }

    private function resolveBookingTimeLimitMinutes(Tour $tour): int
    {
        $tour->loadMissing('company.companySetting');

        $minutes = (int) ($tour->company?->companySetting?->booking_entry_time_limit ?? 0);

        return $minutes > 0 ? $minutes : 10;
    }
}
