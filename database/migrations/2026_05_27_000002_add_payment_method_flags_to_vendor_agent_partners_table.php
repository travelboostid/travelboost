<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vendor_agent_partners', function (Blueprint $table): void {
            $table->boolean('manual_payment_enabled')->default(true)->after('payment_mode');
            $table->boolean('online_payment_enabled')->default(true)->after('manual_payment_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('vendor_agent_partners', function (Blueprint $table): void {
            $table->dropColumn(['manual_payment_enabled', 'online_payment_enabled']);
        });
    }
};
