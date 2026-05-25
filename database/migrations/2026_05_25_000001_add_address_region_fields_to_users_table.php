<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            if (! Schema::hasColumn('users', 'province_id')) {
                $table->foreignId('province_id')->nullable()->after('address')->constrained(config('laravolt.indonesia.table_prefix').'provinces')->nullOnDelete();
            }

            if (! Schema::hasColumn('users', 'city_id')) {
                $table->foreignId('city_id')->nullable()->after('province_id')->constrained(config('laravolt.indonesia.table_prefix').'cities')->nullOnDelete();
            }

            if (! Schema::hasColumn('users', 'district_id')) {
                $table->foreignId('district_id')->nullable()->after('city_id')->constrained(config('laravolt.indonesia.table_prefix').'districts')->nullOnDelete();
            }

            if (! Schema::hasColumn('users', 'village_id')) {
                $table->foreignId('village_id')->nullable()->after('district_id')->constrained(config('laravolt.indonesia.table_prefix').'villages')->nullOnDelete();
            }

            if (! Schema::hasColumn('users', 'postal_code')) {
                $table->string('postal_code')->nullable()->after('village_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $columns = [];

            if (Schema::hasColumn('users', 'province_id')) {
                $table->dropForeign(['province_id']);
                $columns[] = 'province_id';
            }

            if (Schema::hasColumn('users', 'city_id')) {
                $table->dropForeign(['city_id']);
                $columns[] = 'city_id';
            }

            if (Schema::hasColumn('users', 'district_id')) {
                $table->dropForeign(['district_id']);
                $columns[] = 'district_id';
            }

            if (Schema::hasColumn('users', 'village_id')) {
                $table->dropForeign(['village_id']);
                $columns[] = 'village_id';
            }

            if (Schema::hasColumn('users', 'postal_code')) {
                $columns[] = 'postal_code';
            }

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
