<?php

use App\Actions\Booking\ExpireBookingReservationsAction;
use App\Console\Commands\CancelOverdueDownPaymentBookings;
use App\Console\Commands\CheckAgentSubscriptionExpiry;
use App\Console\Commands\ExpireManualReservedAvailabilities;
use App\Console\Commands\SendBookingDeadlineReminders;
use App\Jobs\MarkExpiredPaymentsJob;
use App\Jobs\SyncGoogleAdsSpendJob;
use App\Jobs\SyncMetaAdsSpendJob;
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

Schedule::job(new SyncGoogleAdsSpendJob)
    ->hourly()
    ->name('sync-google-ads-spend')
    ->timezone(config('travelboost.scheduler_timezone'))
    ->withoutOverlapping()
    ->onOneServer();
Schedule::job(new SyncMetaAdsSpendJob)
    ->hourly()
    ->name('sync-meta-ads-spend')
    ->timezone(config('travelboost.scheduler_timezone'))
    ->withoutOverlapping()
    ->onOneServer();
Schedule::command(ExpireManualReservedAvailabilities::class)
    ->everyMinute()
    ->name('expire-manual-reserved-availabilities')
    ->timezone(config('travelboost.scheduler_timezone'))
    ->withoutOverlapping()
    ->onOneServer();
