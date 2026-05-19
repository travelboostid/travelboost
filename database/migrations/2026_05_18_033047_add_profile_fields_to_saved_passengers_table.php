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
        Schema::table('saved_passengers', function (Blueprint $table) {
            $table->string('title')->nullable()->after('user_id');
            $table->string('passport_file_path')->nullable()->after('visa_number');
            $table->string('visa_file_path')->nullable()->after('passport_file_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('saved_passengers', function (Blueprint $table) {
            $table->dropColumn(['title', 'passport_file_path', 'visa_file_path']);
        });
    }
};
