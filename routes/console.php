<?php

use App\Actions\Booking\ExpireBookingReservationsAction;
use App\Actions\WaitingList\ExpirePastDeadlineWaitingListSchedulesAction;
use App\Actions\WaitingList\ExpireWaitingListOffersAction;
use App\Actions\WaitingList\ProcessWaitingListOffersForScheduleAction;
use App\Console\Commands\CancelOverdueDownPaymentBookings;
use App\Console\Commands\CheckAgentSubscriptionExpiry;
use App\Console\Commands\ExpireManualReservedAvailabilities;
use App\Console\Commands\SendBookingDeadlineReminders;
use App\Enums\TourWaitingListScheduleStatus;
use App\Jobs\MarkExpiredPaymentsJob;
use App\Models\TourWaitingListSchedule;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Release Expired Reservations
|--------------------------------------------------------------------------
|
| Runs every minute. Finds all system-held booking reservations whose timer
| has expired, flips them to EXPIRED, and lets the availability snapshot
| action recompute tour_availabilities from bookings.
|
| Idempotent: only processes BOOKING_RESERVED rows, and the status change is
| atomic per-row inside a transaction.
|
*/
Schedule::call(function () {
    app(ExpireBookingReservationsAction::class)->execute();
})->everyMinute()
    ->name('release-expired-reservations')
    ->timezone(config('travelboost.scheduler_timezone'))
    ->withoutOverlapping()
    ->onOneServer();

Schedule::command(CheckAgentSubscriptionExpiry::class)
    ->dailyAt(config('travelboost.agent_subscription_expiry_check_time', '00:00'))
    ->name('agent-subscription-expiry-check')
    ->timezone(config('travelboost.scheduler_timezone'))
    ->withoutOverlapping()
    ->onOneServer();

Schedule::command(SendBookingDeadlineReminders::class)
    ->daily()
    ->name('booking-deadline-reminders')
    ->timezone(config('travelboost.scheduler_timezone'))
    ->withoutOverlapping()
    ->onOneServer();

Schedule::command(CancelOverdueDownPaymentBookings::class)
    ->dailyAt('00:00')
    ->timezone('Asia/Jakarta')
    ->name('cancel-overdue-down-payment-bookings')
    ->withoutOverlapping()
    ->onOneServer();

Schedule::job(new MarkExpiredPaymentsJob)
    ->everyMinute()
    ->name('mark-expired-payments')
    ->timezone(config('travelboost.scheduler_timezone'))
    ->withoutOverlapping()
    ->onOneServer();
Schedule::command(ExpireManualReservedAvailabilities::class)
    ->everyMinute()
    ->name('expire-manual-reserved-availabilities')
    ->timezone(config('travelboost.scheduler_timezone'))
    ->withoutOverlapping()
    ->onOneServer();

Schedule::call(function () {
    app(ExpireWaitingListOffersAction::class)->execute();
})->everyMinute()
    ->name('expire-waiting-list-offers')
    ->timezone(config('travelboost.scheduler_timezone'))
    ->withoutOverlapping()
    ->onOneServer();

Schedule::call(function () {
    app(ExpirePastDeadlineWaitingListSchedulesAction::class)->execute();
})->everyMinute()
    ->name('expire-past-deadline-waiting-lists')
    ->timezone(config('travelboost.scheduler_timezone'))
    ->withoutOverlapping()
    ->onOneServer();

Schedule::call(function () {
    $scheduleIds = TourWaitingListSchedule::query()
        ->where('status', TourWaitingListScheduleStatus::QUEUED)
        ->distinct()
        ->pluck('tour_schedule_id');

    foreach ($scheduleIds as $tourScheduleId) {
        app(ProcessWaitingListOffersForScheduleAction::class)->execute((int) $tourScheduleId);
    }
})->everyFiveMinutes()
    ->name('process-waiting-list-offers-recovery')
    ->timezone(config('travelboost.scheduler_timezone'))
    ->withoutOverlapping()
    ->onOneServer();
