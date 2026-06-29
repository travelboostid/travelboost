<?php

namespace App\Actions\Booking;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\TourSchedule;
use Illuminate\Support\Facades\DB;

class ReconcileOverbookedBookingsAction
{
    /**
     * @return list<array{booking_id: int, booking_number: string, action: string}>
     */
    public function execute(bool $dryRun = true): array
    {
        $results = [];

        TourSchedule::query()
            ->with('availability')
            ->whereHas('availability')
            ->orderBy('id')
            ->each(function (TourSchedule $schedule) use ($dryRun, &$results): void {
                $availability = $schedule->availability;

                if (! $availability) {
                    return;
                }

                $maxPax = (int) $availability->max_pax;

                $bookings = Booking::query()
                    ->where('tour_id', $schedule->tour_id)
                    ->where('vendor_id', $schedule->company_id)
                    ->whereDate('departure_date', $schedule->departure_date)
                    ->whereIn('status', BookingStatus::reducingAvailabilityValues())
                    ->with(['payments' => fn ($query) => $query->where('status', 'paid')->orderBy('paid_at')])
                    ->get()
                    ->sortBy(fn (Booking $booking): array => [
                        $this->priorityTimestamp($booking),
                        (int) $booking->id,
                    ])
                    ->values();

                $remainingSeats = $maxPax;
                $losers = collect();

                foreach ($bookings as $booking) {
                    $requiredSeats = $booking->seatTakingPaxCount();

                    if ($requiredSeats <= $remainingSeats) {
                        $remainingSeats -= $requiredSeats;

                        continue;
                    }

                    $losers->push($booking);
                }

                foreach ($losers as $booking) {
                    $entry = [
                        'booking_id' => (int) $booking->id,
                        'booking_number' => (string) $booking->booking_number,
                        'action' => $dryRun ? 'would_cancel' : 'cancelled',
                    ];

                    if (! $dryRun) {
                        DB::transaction(function () use ($booking): void {
                            $booking->update([
                                'status' => BookingStatus::CANCELLED,
                                'reserved_expires_at' => null,
                            ]);

                            $booking->payments()
                                ->whereIn('status', ['unpaid', 'pending'])
                                ->update(['status' => 'cancelled']);
                        });

                        app(SyncAvailabilityAction::class)->executeForBooking($booking->fresh());
                    }

                    $results[] = $entry;
                }
            });

        return $results;
    }

    private function priorityTimestamp(Booking $booking): string
    {
        $paidPayments = $booking->payments
            ->filter(fn ($payment): bool => $payment->paid_at !== null || $payment->status === 'paid');

        if ($paidPayments->isNotEmpty()) {
            $earliestPaidPayment = $paidPayments
                ->sortBy(fn ($payment): string => ($payment->paid_at ?? $payment->created_at)->format('Y-m-d H:i:s.u'))
                ->first();

            return ($earliestPaidPayment->paid_at ?? $earliestPaidPayment->created_at)->format('Y-m-d H:i:s.u');
        }

        return ($booking->created_at ?? now())->format('Y-m-d H:i:s.u');
    }
}
