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
        Schema::table('bookings', function (Blueprint $table) {
            $table->foreignId('input_by_user_id')
                ->nullable()
                ->after('contact_notes')
                ->constrained('users')
                ->nullOnDelete();
            $table->foreignId('input_by_company_id')
                ->nullable()
                ->after('input_by_user_id')
                ->constrained('companies')
                ->nullOnDelete();
            $table->string('input_by_role')
                ->nullable()
                ->after('input_by_company_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropConstrainedForeignId('input_by_user_id');
            $table->dropConstrainedForeignId('input_by_company_id');
            $table->dropColumn('input_by_role');
        });
    }
};
