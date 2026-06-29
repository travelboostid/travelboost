<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_methods', function (Blueprint $table): void {
            $table->string('usage_scope', 32)->default('booking')->after('provider');
        });

        DB::table('payment_methods')
            ->where('provider', 'midtrans')
            ->update(['usage_scope' => 'platform']);

        DB::table('payment_methods')
            ->where('provider', 'prismalink')
            ->update(['usage_scope' => 'booking']);
    }

    public function down(): void
    {
        Schema::table('payment_methods', function (Blueprint $table): void {
            $table->dropColumn('usage_scope');
        });
    }
};
