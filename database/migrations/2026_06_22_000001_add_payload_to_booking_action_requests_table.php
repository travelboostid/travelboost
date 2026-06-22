<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('booking_action_requests', function (Blueprint $table): void {
            $table->json('payload')->nullable()->after('reason');
        });
    }

    public function down(): void
    {
        Schema::table('booking_action_requests', function (Blueprint $table): void {
            $table->dropColumn('payload');
        });
    }
};
