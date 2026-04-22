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
        Schema::table('tour_add_ons', function (Blueprint $table) {
            $table->unique(['company_id', 'schedule_id', 'description'], 'tour_add_ons_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tour_add_ons', function (Blueprint $table) {
            $table->dropUnique('tour_add_ons_unique');
        });
    }
};
