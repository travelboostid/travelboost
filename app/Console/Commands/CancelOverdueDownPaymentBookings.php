<?php

namespace App\Console\Commands;

use App\Actions\Booking\CancelOverdueDownPaymentBookingsAction;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('booking:cancel-overdue-down-payments')]
#[Description('Cancel down payment bookings whose full payment due date has passed.')]
class CancelOverdueDownPaymentBookings extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(CancelOverdueDownPaymentBookingsAction $action): int
    {
        $cancelledCount = $action->execute();

        $this->info("Cancelled {$cancelledCount} overdue down payment booking(s).");

        return self::SUCCESS;
    }
}
