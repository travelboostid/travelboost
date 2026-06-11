<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tour_availabilities', function (Blueprint $table): void {
            if (! Schema::hasColumn('tour_availabilities', 'manual_reserved_pending_value')) {
                $table->unsignedInteger('manual_reserved_pending_value')
                    ->nullable()
                    ->after('RS');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tour_availabilities', function (Blueprint $table): void {
            if (Schema::hasColumn('tour_availabilities', 'manual_reserved_pending_value')) {
                $table->dropColumn('manual_reserved_pending_value');
            }
        });
    }
};
