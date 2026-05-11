<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('bookings', 'reserved_expires_at')) {
            Schema::table('bookings', function (Blueprint $table) {
                $table->timestamp('reserved_expires_at')->nullable()->after('reserved_type');
            });
        }

        DB::table('bookings')
            ->where('status', 'booking reserved')
            ->where('reserved_type', 'system')
            ->whereNull('reserved_expires_at')
            ->update([
                'reserved_expires_at' => DB::raw("updated_at + interval '10 minutes'"),
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('bookings', 'reserved_expires_at')) {
            Schema::table('bookings', function (Blueprint $table) {
                $table->dropColumn('reserved_expires_at');
            });
        }
    }
};
