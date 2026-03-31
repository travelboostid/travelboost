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
        Schema::create('tour_schedules', function (Blueprint $table) {
            $table->id();

            $table->foreignId('tour_id')
                ->constrained()
                ->cascadeOnDelete();

            // Dates
            $table->date('departure_date');
            $table->date('return_date')->nullable();

            // Capacity
            $table->unsignedInteger('quota')->default(0);
            $table->unsignedInteger('booked')->default(0);

            // Pricing per departure
            $table->decimal('price', 12, 2)->nullable();
            $table->decimal('agent_price', 12, 2)->nullable();

            // Booking control
            $table->date('cutoff_date')->nullable();

            // Status
            $table->boolean('is_active')->default(true);

            // Notes
            $table->string('note')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tour_schedules');
    }
};
