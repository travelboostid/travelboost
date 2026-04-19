<?php

use App\Enums\UserGender;
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
        Schema::create('booking_passengers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('bookings')->cascadeOnDelete();
            $table->string('first_name');
            $table->string('last_name')->nullable();
            $table->string('gender')->default(UserGender::UNSPECIFIED->value);
            $table->date('dob')->nullable();
            $table->string('pob')->nullable();
            $table->string('room_type')->nullable();
            $table->string('room_number')->nullable();
            $table->string('passport_file_path')->nullable();
            $table->string('visa_file_path')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('booking_passengers');
    }
};
