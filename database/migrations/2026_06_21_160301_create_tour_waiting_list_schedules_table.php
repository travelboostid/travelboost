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
        Schema::create('tour_waiting_list_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tour_waiting_list_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tour_schedule_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('preference_order');
            $table->unsignedInteger('available_seats_at_request');
            $table->decimal('display_price_at_request', 15, 2)->nullable();
            $table->timestamps();

            $table->unique(['tour_waiting_list_id', 'tour_schedule_id'], 'tour_waiting_list_schedule_unique');
            $table->unique(['tour_waiting_list_id', 'preference_order'], 'tour_waiting_list_preference_unique');
            $table->index('tour_schedule_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tour_waiting_list_schedules');
    }
};
