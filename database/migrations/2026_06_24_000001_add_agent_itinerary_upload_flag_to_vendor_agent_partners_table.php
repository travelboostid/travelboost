<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vendor_agent_partners', function (Blueprint $table): void {
            $table->boolean('agent_itinerary_upload_enabled')
                ->default(false)
                ->after('online_payment_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('vendor_agent_partners', function (Blueprint $table): void {
            $table->dropColumn('agent_itinerary_upload_enabled');
        });
    }
};
