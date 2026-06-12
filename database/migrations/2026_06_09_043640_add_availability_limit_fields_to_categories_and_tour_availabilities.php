<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tour_categories', function (Blueprint $table): void {
            if (! Schema::hasColumn('tour_categories', 'manual_reserved_limit_value')) {
                $table->unsignedInteger('manual_reserved_limit_value')->default(1)->after('position_no');
            }

            if (! Schema::hasColumn('tour_categories', 'manual_reserved_limit_unit')) {
                $table->enum('manual_reserved_limit_unit', ['minute', 'hour'])->default('hour')->after('manual_reserved_limit_value');
            }
        });

        Schema::table('tour_availabilities', function (Blueprint $table): void {
            if (! Schema::hasColumn('tour_availabilities', 'manual_reserved_started_at')) {
                $table->timestamp('manual_reserved_started_at')->nullable()->after('RS');
            }

            if (! Schema::hasColumn('tour_availabilities', 'manual_reserved_expires_at')) {
                $table->timestamp('manual_reserved_expires_at')->nullable()->after('manual_reserved_started_at');
            }

            if (! Schema::hasColumn('tour_availabilities', 'manual_reserved_original_available')) {
                $table->unsignedInteger('manual_reserved_original_available')->nullable()->after('manual_reserved_expires_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tour_availabilities', function (Blueprint $table): void {
            if (Schema::hasColumn('tour_availabilities', 'manual_reserved_original_available')) {
                $table->dropColumn('manual_reserved_original_available');
            }

            if (Schema::hasColumn('tour_availabilities', 'manual_reserved_expires_at')) {

                $table->dropColumn('manual_reserved_expires_at');
            }

            if (Schema::hasColumn('tour_availabilities', 'manual_reserved_started_at')) {
                $table->dropColumn('manual_reserved_started_at');
            }
        });

        Schema::table('tour_categories', function (Blueprint $table): void {
            if (Schema::hasColumn('tour_categories', 'manual_reserved_limit_unit')) {
                $table->dropColumn('manual_reserved_limit_unit');
            }

            if (Schema::hasColumn('tour_categories', 'manual_reserved_limit_value')) {
                $table->dropColumn('manual_reserved_limit_value');
            }
        });
    }
};
