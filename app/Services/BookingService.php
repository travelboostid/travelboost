<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Enums\UserGender;
use App\Models\Booking;
use App\Models\Tour;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
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
        $paymentMode = $this->resolvePaymentMode(data_get($data, 'payment_method'));

        return DB::transaction(function () use ($data, $user, $paymentMode, $tour) {
            app(BookingRoomArrangementValidator::class)->validateRooms(
                data_get($data, 'passengers', []),
                is_array(data_get($data, 'rooms')) ? data_get($data, 'rooms') : []
            );

            $quote = app(BookingPricingService::class)->quoteForBookingData(
                $tour,
                (string) data_get($data, 'departure_date'),
                data_get($data, 'passengers', []),
                data_get($data, 'addons', []),
                (float) ($tour->company?->companySetting?->minimum_vat ?? 11),
                data_get($data, 'agent_id') !== null,
                data_get($data, 'agent_id') ? (int) data_get($data, 'agent_id') : null,
            );
            $totals = app(BookingPricingService::class)->bookingTotalsFromQuote($quote);

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
                    'total_price' => $totals['total_price'],
                    'tax_amount' => $totals['tax_amount'],
                    'platform_fee' => $totals['platform_fee'],
                    'commission_amount' => $totals['commission_amount'],
                    'grand_total' => $totals['grand_total'],
                    'payment_mode' => $paymentMode,
                    'contact_name' => data_get($data, 'contact_name'),
                    'contact_email' => data_get($data, 'contact_email'),
                    'contact_phone' => data_get($data, 'contact_phone'),
                    'contact_notes' => data_get($data, 'contact_notes'),
                    'status' => BookingStatus::BOOKING_RESERVED,
                    'input_by_user_id' => data_get($data, 'input_by_user_id', $user->id),
                    'input_by_company_id' => data_get($data, 'input_by_company_id'),
                    'input_by_role' => data_get($data, 'input_by_role', 'customer'),
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

            $persistedPassengers = collect();

            if (! empty($data['passengers'])) {
                $passengerRows = $this->preparePassengerRows($quote['passengers']);

                $persistedPassengers = $booking->passengers()->createMany($passengerRows);
                $this->syncSavedPassengers($user, $passengerRows);
            }

            if (array_key_exists('rooms', $data) && ! empty($data['rooms'])) {
                $booking->rooms()->createMany($this->normalizeRoomGuestIds(
                    $data['rooms'],
                    $this->guestIdMapForPersistedPassengers($quote['passengers'], $persistedPassengers)
                ));
            }

            if (! empty($quote['addons'])) {
                $booking->addons()->createMany($quote['addons']);
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
     * Update an existing booking snapshot without changing its lifecycle status.
     *
     * @param  array<string, mixed>  $data
     */
    public function updateBookingSnapshot(Booking $booking, array $data, ?User $savedPassengerOwner = null): Booking
    {
        return DB::transaction(function () use ($booking, $data, $savedPassengerOwner): Booking {
            $booking->loadMissing(['tour.company.companySetting', 'vendor.companySetting']);

            app(BookingRoomArrangementValidator::class)->validateRooms(
                data_get($data, 'passengers', []),
                is_array(data_get($data, 'rooms')) ? data_get($data, 'rooms') : []
            );

            $quote = app(BookingPricingService::class)->quoteForBookingData(
                $booking->tour,
                $booking->departure_date,
                data_get($data, 'passengers', []),
                data_get($data, 'addons', []),
                (float) ($booking->vendor?->companySetting?->minimum_vat ?? $booking->tour?->company?->companySetting?->minimum_vat ?? 11),
                $booking->agent_id !== null,
                $booking->agent_id ? (int) $booking->agent_id : null,
            );
            $totals = app(BookingPricingService::class)->bookingTotalsFromQuote($quote);

            $booking->update([
                'contact_name' => data_get($data, 'contact_name'),
                'contact_email' => data_get($data, 'contact_email'),
                'contact_phone' => data_get($data, 'contact_phone'),
                'contact_notes' => data_get($data, 'contact_notes'),
                'pax_adult' => data_get($data, 'pax_adult'),
                'pax_child' => data_get($data, 'pax_child'),
                'pax_infant' => data_get($data, 'pax_infant'),
                'total_price' => $totals['total_price'],
                'tax_amount' => $totals['tax_amount'],
                'platform_fee' => $totals['platform_fee'],
                'commission_amount' => $totals['commission_amount'],
                'grand_total' => $totals['grand_total'],
            ]);

            $retainedPassengerIds = collect($quote['passengers'])
                ->pluck('id')
                ->filter()
                ->map(fn ($id) => (int) $id)
                ->values();

            if ($retainedPassengerIds->isNotEmpty()) {
                $booking->passengers()
                    ->whereNotIn('id', $retainedPassengerIds)
                    ->delete();
            } else {
                $booking->passengers()->delete();
            }

            $passengerRows = $this->preparePassengerRows($quote['passengers']);
            $persistedPassengers = collect();

            foreach ($passengerRows as $index => $payload) {
                $incomingPassengerId = data_get($quote['passengers'], "{$index}.id");

                if (! empty($incomingPassengerId)) {
                    $booking->passengers()
                        ->where('id', $incomingPassengerId)
                        ->update($payload);

                    $persistedPassengers->put($index, (object) ['id' => (int) $incomingPassengerId]);

                    continue;
                }

                $persistedPassengers->put($index, $booking->passengers()->create($payload));
            }

            if ($savedPassengerOwner) {
                $this->syncSavedPassengers($savedPassengerOwner, $passengerRows);
            }

            if (array_key_exists('rooms', $data)) {
                $rooms = data_get($data, 'rooms', []);

                $booking->rooms()->delete();
                $booking->rooms()->createMany($this->normalizeRoomGuestIds(
                    is_array($rooms) ? $rooms : [],
                    $this->guestIdMapForPersistedPassengers($quote['passengers'], $persistedPassengers)
                ));
            }

            if (array_key_exists('addons', $data)) {
                $booking->addons()->delete();
                $booking->addons()->createMany($quote['addons'] ?? []);
            }

            return $booking->fresh(['passengers', 'rooms', 'addons']);
        });
    }

    /**
     * @param  array<int, array<string, mixed>>  $rooms
     * @param  array<string, string>  $guestIdMap
     * @return array<int, array<string, mixed>>
     */
    public function normalizeRoomGuestIds(array $rooms, array $guestIdMap): array
    {
        return collect($rooms)
            ->map(function (array $room) use ($guestIdMap): array {
                if (! array_key_exists('bed_layout', $room) || ! is_array($room['bed_layout'])) {
                    return $room;
                }

                $room['bed_layout'] = collect($room['bed_layout'])
                    ->map(function (array $bed) use ($guestIdMap): array {
                        $guestId = data_get($bed, 'guestId');

                        if (filled($guestId) && array_key_exists((string) $guestId, $guestIdMap)) {
                            $bed['guestId'] = $guestIdMap[(string) $guestId];
                        }

                        return $bed;
                    })
                    ->all();

                return $room;
            })
            ->all();
    }

    /**
     * @param  array<int, array<string, mixed>>  $passengers
     * @param  Collection<int, mixed>  $persistedPassengers
     * @return array<string, string>
     */
    public function guestIdMapForPersistedPassengers(array $passengers, Collection $persistedPassengers): array
    {
        $guestIdMap = [];

        foreach ($passengers as $index => $passenger) {
            $persistedPassenger = $persistedPassengers->get($index);
            $persistedPassengerId = data_get($persistedPassenger, 'id');

            if (! $persistedPassengerId) {
                continue;
            }

            $clientGuestId = data_get($passenger, 'client_guest_id');

            if (filled($clientGuestId)) {
                $guestIdMap[(string) $clientGuestId] = (string) $persistedPassengerId;
            }

            $incomingPassengerId = data_get($passenger, 'id');

            if (filled($incomingPassengerId)) {
                $guestIdMap[(string) $incomingPassengerId] = (string) $persistedPassengerId;
            }
        }

        return $guestIdMap;
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
                    'visa_category_item_id',
                    'visa_type_description',
                    'visa_type_price',
                    'visa_type_is_taxable',
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
