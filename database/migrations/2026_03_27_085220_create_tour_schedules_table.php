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
                ->constrained('tours')
                ->cascadeOnDelete();

            $table->string('tour_code')->nullable();

            $table->foreignId('company_id')
                ->constrained('companies')
                ->cascadeOnDelete();

            // Dates
            $table->date('departure_date');
            $table->date('return_date')->nullable();

            // Capacity
            $table->unsignedInteger('quota')->default(0);
            //$table->unsignedInteger('booked')->default(0);

            // Pricing per departure
            //$table->decimal('price', 12, 2)->nullable();
            //$table->decimal('agent_price', 12, 2)->nullable();

            // Booking control
            $table->date('cutoff_date')->nullable();

            // Status
            $table->boolean('is_active')->default(true);

            // Notes
            $table->string('note')->nullable();

            $table->timestamps();
        });

        Schema::create('price_categories', function (Blueprint $table) {
          $table->id();

          $table->foreignId('company_id')
                ->constrained('companies')
                ->cascadeOnDelete();

          $table->string('name');
          $table->text('description')->nullable();

          $table->timestamps();

          $table->unique(['company_id', 'name']);
        });

        Schema::create('tour_prices', function (Blueprint $table) {
          $table->id();

          $table->foreignId('company_id')
                ->constrained('companies')
                ->cascadeOnDelete();

          $table->string('tour_code')->nullable();

          $table->foreignId('schedule_id')
                ->constrained('tour_schedules')
                ->cascadeOnDelete();

          $table->foreignId('price_category_id')
                ->constrained('price_categories')
                ->cascadeOnDelete();

          $table->string('currency');
          $table->decimal('price', 12, 2)->nullable();
          $table->decimal('promotion_rate', 12, 2)->default(0);
          $table->decimal('promotion', 12, 2)->default(0);
          $table->decimal('commission_rate', 12, 2)->default(0);
          $table->decimal('commission', 12, 2)->default(0);
        });

        Schema::create('tour_add_ons', function (Blueprint $table) {
          $table->id();

          $table->foreignId('company_id')
                ->constrained('companies')
                ->cascadeOnDelete();

          $table->foreignId('tour_code')
                ->constrained('tours')
                ->cascadeOnDelete();

          $table->foreignId('schedule_id')
                ->constrained('tour_schedules')
                ->cascadeOnDelete();
          
          $table->string('description');
          $table->decimal('price', 12, 2)->nullable();

          $table->timestamps();
        });

        Schema::create('tour_availabilities', function (Blueprint $table) {
          $table->id();

          $table->foreignId('company_id')
                ->constrained('companies')
                ->cascadeOnDelete();

          $table->foreignId('tour_code')
                ->constrained('tours')
                ->cascadeOnDelete();

          $table->foreignId('schedule_id')
                ->constrained('tour_schedules')
                ->cascadeOnDelete();
          
          $table->decimal('max_pax', 12, 2)->default(0);
          $table->decimal('WP', 12, 2)->default(0);
          $table->decimal('DP', 12, 2)->default(0);
          $table->decimal('FP', 12, 2)->default(0);
          $table->decimal('RS', 12, 2)->default(0);
          $table->decimal('CA', 12, 2)->default(0);
          $table->decimal('RF', 12, 2)->default(0);
          $table->decimal('EX', 12, 2)->default(0);
          $table->decimal('WL', 12, 2)->default(0);
          $table->decimal('available', 12, 2)->default(0);

          $table->timestamps();
        });

        Schema::create('currencies', function (Blueprint $table) {
          $table->id();
          $table->string('code', 3)->unique(); // USD
          $table->string('name')->nullable();  // US Dollar
          $table->timestamps();
      });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tour_schedules');
        Schema::dropIfExists('price_categories');
        Schema::dropIfExists('tour_prices');
        Schema::dropIfExists('tour_add_ons');
        Schema::dropIfExists('tour_availabilities');
        Schema::dropIfExists('currencies');
    }
};
