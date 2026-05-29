<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('company_settings', function (Blueprint $table) {
            $table->decimal('minimum_down_payment_value', 12, 2)
                ->default(0)
                ->change();
        });
    }

    public function down(): void
    {
        Schema::table('company_settings', function (Blueprint $table) {
            $table->decimal('minimum_down_payment_value', 5, 2)
                ->default(0)
                ->change();
        });
    }
};
