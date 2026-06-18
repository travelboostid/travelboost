<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('promotion_budget_transactions', function (Blueprint $table) {
            $table->string('platform')->nullable()->after('type');
        });
    }

    public function down(): void
    {
        Schema::table('promotion_budget_transactions', function (Blueprint $table) {
            $table->dropColumn('platform');
        });
    }
};
