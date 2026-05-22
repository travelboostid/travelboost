<?php

namespace App\Observers;

use App\Jobs\SyncTourAvailabilityJob;
use App\Models\Booking;
use Illuminate\Support\Facades\Log;

class BookingObserver
{
    /**
     * Handle events after all transactions are committed.
     * This is crucial for PostgreSQL because Cache locks catch QueryExceptions,
     * which would otherwise abort the entire open transaction.
     */
    public bool $afterCommit = true;

    /**
     * Fields that, when changed, shift the availability lookup key
     * and require a re-sync of the OLD schedule slot.
     *
     * @var list<string>
     */
    private const KEY_FIELDS = ['tour_id', 'departure_date', 'vendor_id'];

    /**
     * All fields whose change should trigger a re-sync of the CURRENT slot.
     *
     * @var list<string>
     */
    private const SYNC_FIELDS = ['status', 'pax_adult', 'pax_child', 'pax_infant', 'departure_date', 'tour_id', 'vendor_id'];

    public function created(Booking $booking): void
    {
        $this->dispatchForCurrentKey($booking);
    }

    public function updated(Booking $booking): void
    {
        if ($booking->isDirty(self::KEY_FIELDS)) {
            $originalVendorId = $booking->getOriginal('vendor_id');

            if ($originalVendorId === null) {
                Log::warning('BookingObserver: skipping old-key dispatch — original vendor_id is null', [
                    'booking_id' => $booking->id,
                ]);
            } else {
                SyncTourAvailabilityJob::dispatch(
                    (int) $booking->getOriginal('tour_id'),
                    $booking->getOriginal('departure_date') instanceof \DateTimeInterface
                      ? $booking->getOriginal('departure_date')->format('Y-m-d')
                      : (string) $booking->getOriginal('departure_date'),
                    (int) $originalVendorId,
                );
            }
        }

        if ($booking->isDirty(self::SYNC_FIELDS)) {
            $this->dispatchForCurrentKey($booking);
        }
    }

    public function deleted(Booking $booking): void
    {
        $this->dispatchForCurrentKey($booking);
    }

    public function restored(Booking $booking): void
    {
        $this->dispatchForCurrentKey($booking);
    }

    /**
     * Dispatch the sync job for the booking's current key triple.
     * Skips dispatch when vendor_id is null (cannot resolve schedule).
     */
    private function dispatchForCurrentKey(Booking $booking): void
    {
        if ($booking->vendor_id === null) {
            Log::warning('BookingObserver: skipping dispatch — vendor_id is null', [
                'booking_id' => $booking->id,
            ]);

            return;
        }

        SyncTourAvailabilityJob::dispatch(
            (int) $booking->tour_id,
            $booking->departure_date->toDateString(),
            (int) $booking->vendor_id,
        );
    }
}
