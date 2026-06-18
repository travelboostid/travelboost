<?php

use App\Enums\AdPlatformConnectionStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ad_platform_connections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('platform');
            $table->string('status')->default(AdPlatformConnectionStatus::PendingProvisioning->value);
            $table->string('external_account_id')->nullable();
            $table->string('external_account_name')->nullable();
            $table->nullableMorphs('oauth_account');
            $table->json('meta')->nullable();
            $table->timestamp('provisioned_at')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'platform']);
            $table->index(['platform', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ad_platform_connections');
    }
};
