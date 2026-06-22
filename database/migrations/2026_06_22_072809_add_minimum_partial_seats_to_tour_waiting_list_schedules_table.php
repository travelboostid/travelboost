<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tour_waiting_list_schedules', function (Blueprint $table) {
            $table->unsignedSmallInteger('minimum_partial_seats')
                ->nullable()
                ->after('accepts_partial_fulfillment');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tour_waiting_list_schedules', function (Blueprint $table) {
            $table->dropColumn('minimum_partial_seats');
        });
    }
};
