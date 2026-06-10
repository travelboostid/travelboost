<?php

use App\Actions\Booking\ExpireBookingReservationsAction;
use App\Console\Commands\CancelOverdueDownPaymentBookings;
use App\Console\Commands\CheckAgentSubscriptionExpiry;
use App\Console\Commands\SendBookingDeadlineReminders;
use App\Jobs\MarkExpiredPaymentsJob;
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
    ->withoutOverlapping()
    ->onOneServer();

Schedule::command(CheckAgentSubscriptionExpiry::class)
    ->dailyAt(config('travelboost.agent_subscription_expiry_check_time', '00:00'))
    ->name('agent-subscription-expiry-check')
    ->withoutOverlapping()
    ->onOneServer();

Schedule::command(SendBookingDeadlineReminders::class)
    ->daily()
    ->name('booking-deadline-reminders')
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
    ->withoutOverlapping()
    ->onOneServer();
