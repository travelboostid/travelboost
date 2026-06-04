<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tour_add_ons', function (Blueprint $table): void {
            if (! Schema::hasColumn('tour_add_ons', 'is_taxable')) {
                $table->boolean('is_taxable')->default(false);
            }
        });

        Schema::table('booking_addons', function (Blueprint $table): void {
            if (! Schema::hasColumn('booking_addons', 'is_taxable')) {
                $table->boolean('is_taxable')->default(false);
            }
        });

        $this->replaceAdminCommissionMax('100000', '75000');
    }

    public function down(): void
    {
        Schema::table('booking_addons', function (Blueprint $table): void {
            if (Schema::hasColumn('booking_addons', 'is_taxable')) {
                $table->dropColumn('is_taxable');
            }
        });

        Schema::table('tour_add_ons', function (Blueprint $table): void {
            if (Schema::hasColumn('tour_add_ons', 'is_taxable')) {
                $table->dropColumn('is_taxable');
            }
        });

        $this->replaceAdminCommissionMax('75000', '100000');
    }

    private function replaceAdminCommissionMax(string $from, string $to): void
    {
        $config = DB::table('app_configs')->where('key', 'admin')->first();

        if (! $config) {
            return;
        }

        $value = is_string($config->value)
            ? json_decode($config->value, true)
            : (array) $config->value;

        if (! is_array($value) || (string) ($value['commission_max'] ?? '') !== $from) {
            return;
        }

        $value['commission_max'] = $to;

        DB::table('app_configs')
            ->where('key', 'admin')
            ->update(['value' => json_encode($value)]);
    }
};
