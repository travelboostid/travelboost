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
        Schema::table('tour_waiting_list_schedules', function (Blueprint $table) {
            $table->unsignedSmallInteger('pax_adult')->default(0);
            $table->unsignedSmallInteger('pax_child')->default(0);
            $table->unsignedSmallInteger('pax_infant')->default(0);
            $table->boolean('accepts_partial_fulfillment')->default(false);
            $table->boolean('is_priority')->default(false)->index();
        });

        DB::table('tour_waiting_lists')
            ->orderBy('id')
            ->chunkById(100, function ($waitingLists): void {
                foreach ($waitingLists as $waitingList) {
                    DB::table('tour_waiting_list_schedules')
                        ->where('tour_waiting_list_id', $waitingList->id)
                        ->update([
                            'pax_adult' => $waitingList->pax_adult,
                            'pax_child' => $waitingList->pax_child,
                            'pax_infant' => $waitingList->pax_infant,
                            'accepts_partial_fulfillment' => $waitingList->accepts_partial_fulfillment,
                        ]);

                    DB::table('tour_waiting_list_schedules')
                        ->where('tour_waiting_list_id', $waitingList->id)
                        ->where('preference_order', 1)
                        ->update(['is_priority' => true]);
                }
            });

        Schema::table('tour_waiting_lists', function (Blueprint $table) {
            $table->dropColumn([
                'pax_adult',
                'pax_child',
                'pax_infant',
                'accepts_partial_fulfillment',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tour_waiting_lists', function (Blueprint $table) {
            $table->unsignedSmallInteger('pax_adult')->default(0);
            $table->unsignedSmallInteger('pax_child')->default(0);
            $table->unsignedSmallInteger('pax_infant')->default(0);
            $table->boolean('accepts_partial_fulfillment')->default(false);
        });

        DB::table('tour_waiting_lists')
            ->orderBy('id')
            ->chunkById(100, function ($waitingLists): void {
                foreach ($waitingLists as $waitingList) {
                    $schedule = DB::table('tour_waiting_list_schedules')
                        ->where('tour_waiting_list_id', $waitingList->id)
                        ->orderByDesc('is_priority')
                        ->orderBy('preference_order')
                        ->first();

                    if ($schedule !== null) {
                        DB::table('tour_waiting_lists')
                            ->where('id', $waitingList->id)
                            ->update([
                                'pax_adult' => $schedule->pax_adult,
                                'pax_child' => $schedule->pax_child,
                                'pax_infant' => $schedule->pax_infant,
                                'accepts_partial_fulfillment' => $schedule->accepts_partial_fulfillment,
                            ]);
                    }
                }
            });

        Schema::table('tour_waiting_list_schedules', function (Blueprint $table) {
            $table->dropColumn([
                'pax_adult',
                'pax_child',
                'pax_infant',
                'accepts_partial_fulfillment',
                'is_priority',
            ]);
        });
    }
};
