<?php

use App\Enums\AdCampaignStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ad_campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('ad_platform_connection_id')->nullable()->constrained('ad_platform_connections')->nullOnDelete();
            $table->string('platform');
            $table->string('status')->default(AdCampaignStatus::Active->value);
            $table->string('name');
            $table->string('external_campaign_id')->nullable();
            $table->string('external_budget_id')->nullable();
            $table->decimal('daily_budget', 16, 2);
            $table->string('final_url');
            $table->json('targeting')->nullable();
            $table->json('creatives')->nullable();
            $table->json('meta')->nullable();
            $table->decimal('lifetime_spend', 16, 8)->default(0);
            $table->timestamp('paused_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'platform', 'status']);
            $table->index(['platform', 'external_campaign_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ad_campaigns');
    }
};
