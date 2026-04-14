<?php

use App\Enums\BookingStatus;
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
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('booking_number')->unique();
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('vendor_id')->nullable()->constrained('companies');
            $table->foreignId('agent_id')->nullable()->constrained('companies');
            $table->foreignId('tour_id')->constrained('tours');
            $table->date('departure_date');
            $table->string('status')->default(BookingStatus::AWAITING_PAYMENT->value);
            $table->integer('pax_adult')->default(0);
            $table->integer('pax_child')->default(0);
            $table->integer('pax_infant')->default(0);
            $table->decimal('total_price', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('platform_fee', 15, 2)->default(0);
            $table->decimal('commission_amount', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
