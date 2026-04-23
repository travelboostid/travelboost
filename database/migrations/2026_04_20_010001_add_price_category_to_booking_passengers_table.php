<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('booking_passengers', function (Blueprint $table) {
            $table->string('price_category')->nullable();
            $table->bigInteger('price_amount')->unsigned()->default(0);
            $table->string('nationality')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('booking_passengers', function (Blueprint $table) {
            $table->dropColumn(['price_category', 'price_amount', 'nationality']);
        });
    }
};
