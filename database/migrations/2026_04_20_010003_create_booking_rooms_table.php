<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_rooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('bookings')->cascadeOnDelete();
            $table->string('room_type');
            $table->string('room_label')->nullable();
            $table->json('bed_layout')->nullable(); // array of { bedType, guestId, position }
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_rooms');
    }
};
