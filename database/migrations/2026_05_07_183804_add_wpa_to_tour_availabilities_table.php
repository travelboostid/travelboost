<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('tour_availabilities', 'WPA')) {
            Schema::table('tour_availabilities', function (Blueprint $table) {
                $table->unsignedInteger('WPA')->default(0)->after('WP');
            });
        }

        DB::table('bookings')
            ->where('status', 'reserved')
            ->where('reserved_type', 'system')
            ->update(['status' => 'booking reserved']);

        DB::table('bookings')
            ->where('status', 'reserved')
            ->where('reserved_type', 'manual')
            ->update(['status' => 'manual reserved']);

        DB::table('bookings')
            ->where('status', 'awaiting payment')
            ->whereExists(function ($query): void {
                $query->selectRaw('1')
                    ->from('payments')
                    ->whereColumn('payments.payable_id', 'bookings.id')
                    ->where('payments.payable_type', 'App\\Models\\Booking')
                    ->where('payments.provider', 'manual')
                    ->whereIn('payments.payment_method', ['bank_transfer', 'manual_transfer'])
                    ->where('payments.status', 'pending');
            })
            ->update(['status' => 'waiting payment approval']);

        $this->recomputeAvailabilitySnapshots();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('bookings')
            ->where('status', 'waiting payment approval')
            ->update(['status' => 'awaiting payment']);

        if (Schema::hasColumn('tour_availabilities', 'WPA')) {
            Schema::table('tour_availabilities', function (Blueprint $table) {
                $table->dropColumn('WPA');
            });
        }
    }

    private function recomputeAvailabilitySnapshots(): void
    {
        $statusColumnMap = [
            'awaiting payment' => 'WP',
            'waiting payment approval' => 'WPA',
            'down payment' => 'DP',
            'full payment' => 'FP',
            'reserved' => 'BRS',
            'booking reserved' => 'BRS',
            'cancelled' => 'CA',
            'refunded' => 'RF',
            'expired' => 'EX',
            'waiting list' => 'WL',
        ];
        $reducingColumns = ['DP', 'FP', 'RS', 'BRS', 'WPA'];

        DB::table('tour_availabilities')
            ->orderBy('id')
            ->lazy()
            ->each(function ($availability) use ($statusColumnMap, $reducingColumns): void {
                $schedule = DB::table('tour_schedules')
                    ->where('id', $availability->schedule_id)
                    ->first();

                if (! $schedule) {
                    return;
                }

                $totals = DB::table('bookings')
                    ->select('status', DB::raw('COALESCE(SUM(pax_adult + pax_child), 0) as total_pax'))
                    ->where('tour_id', $availability->tour_id)
                    ->where('vendor_id', $availability->company_id)
                    ->whereDate('departure_date', $schedule->departure_date)
                    ->groupBy('status')
                    ->get()
                    ->keyBy('status');

                $snapshotValues = array_fill_keys(array_unique(array_values($statusColumnMap)), 0);
                $snapshotValues['RS'] = (int) $availability->RS;

                foreach ($statusColumnMap as $statusValue => $columnKey) {
                    $row = $totals->get($statusValue);
                    $snapshotValues[$columnKey] += $row ? (int) $row->total_pax : 0;
                }

                $reducingTotal = 0;
                foreach ($reducingColumns as $columnKey) {
                    $reducingTotal += $snapshotValues[$columnKey] ?? 0;
                }

                DB::table('tour_availabilities')
                    ->where('id', $availability->id)
                    ->update([
                        ...$snapshotValues,
                        'available' => max(0, (int) $availability->max_pax - $reducingTotal),
                    ]);
            });
    }
};
