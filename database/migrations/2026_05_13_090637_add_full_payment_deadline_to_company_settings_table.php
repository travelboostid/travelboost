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
        Schema::table('company_settings', function (Blueprint $table) {
            $table->integer('full_payment_deadline')
                ->default(0)
                ->after('booking_entry_time_limit');
            $table->integer('document_completed_deadline')
                ->default(0)
                ->after('full_payment_deadline');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('company_settings', function (Blueprint $table) {
            $table->dropColumn('full_payment_deadline');
            $table->dropColumn('document_completed_deadline');
        });
    }
};
