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
        Schema::create('parameter_travelboost', function (Blueprint $table) {
            $table->id();
            $table->string('description');
            $table->decimal('amount', 18, 2)->default(0);
            $table->decimal('percentage', 12, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('parameter_travelboost');
    }
};
