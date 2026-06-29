<?php

namespace App\Console\Commands;

use App\Actions\Booking\ReconcileOverbookedBookingsAction;
use Illuminate\Console\Command;

class ReconcileOverbookedBookingsCommand extends Command
{
    protected $signature = 'bookings:reconcile-overbooked {--apply : Cancel overbooked bookings instead of dry-run}';

    protected $description = 'Cancel overbooked bookings that lost the seat race, ordered by earliest paid_at then created_at';

    public function handle(ReconcileOverbookedBookingsAction $action): int
    {
        $dryRun = ! $this->option('apply');
        $results = $action->execute($dryRun);

        if ($results === []) {
            $this->info('No overbooked bookings found.');

            return self::SUCCESS;
        }

        $this->table(['Booking ID', 'Booking Number', 'Action'], array_map(
            fn (array $row): array => [$row['booking_id'], $row['booking_number'], $row['action']],
            $results,
        ));

        if ($dryRun) {
            $this->warn('Dry run only. Re-run with --apply to cancel the listed bookings.');
        }

        return self::SUCCESS;
    }
}
