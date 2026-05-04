<?php

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\TourAvailability;
use App\Models\TourSchedule;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Release Expired Reservations
|--------------------------------------------------------------------------
|
| Runs every minute. Finds all bookings still in RESERVED status whose
| updated_at is older than 10 minutes, flips them to EXPIRED, and
| restores the seats back to tour_availabilities.
|
| Idempotent: only processes RESERVED rows, and the status change is
| atomic per-row inside a transaction.
|
*/
Schedule::call(function () {
    $expiredBookings = Booking::query()
        ->where('status', BookingStatus::RESERVED)
        ->where('reserved_type', 'system')
        ->where('updated_at', '<', now()->subMinutes(10))
        ->get();

    if ($expiredBookings->isEmpty()) {
        return;
    }

    foreach ($expiredBookings as $booking) {
        DB::transaction(function () use ($booking) {
            $locked = Booking::query()
                ->where('id', $booking->id)
                ->where('status', BookingStatus::RESERVED)
                ->lockForUpdate()
                ->first();

            if (! $locked) {
                return;
            }

            $locked->update(['status' => BookingStatus::EXPIRED]);

            $totalPax = $locked->pax_adult + $locked->pax_child;

            $tour = $locked->tour;

            if (! $tour) {
                return;
            }

            $schedule = TourSchedule::where('tour_code', $tour->code)
                ->whereDate('departure_date', $locked->departure_date)
                ->first();

            if ($schedule) {
                $availability = TourAvailability::where('schedule_id', $schedule->id)
                    ->where('tour_id', $tour->id)
                    ->lockForUpdate()
                    ->first();

                if ($availability) {
                    $availability->decrement('RS', $totalPax);
                    $availability->increment('EX', $totalPax);
                    $availability->increment('available', $totalPax);
                }
            }

            Log::info('Booking reservation expired', [
                'booking_number' => $locked->booking_number,
                'tour_id' => $locked->tour_id,
                'pax_released' => $totalPax,
            ]);
        });
    }
})->everyMinute()
    ->name('release-expired-reservations')
    ->withoutOverlapping()
    ->onOneServer();
