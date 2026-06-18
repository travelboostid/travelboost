<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('company_facebook_accounts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('company_id')
                ->unique()
                ->constrained()
                ->cascadeOnDelete();

            $table->string('facebook_id', 255)->index();
            $table->string('email', 255)->nullable();
            $table->string('name', 255)->nullable();

            $table->longText('access_token')->nullable();
            $table->longText('refresh_token')->nullable();
            $table->json('scopes')->nullable();
            $table->timestamp('expired_at')->nullable();

            $table->timestamps();
        });

        Schema::create('meta_pixel_connections', function (Blueprint $table) {
            $table->id();

            $table->foreignId('company_id')
                ->unique()
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('company_facebook_account_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->string('pixel_id', 255)->index();
            $table->string('pixel_name', 255)->nullable();
            $table->string('ad_account_id', 255)->nullable();
            $table->string('connection_source', 20)->default('oauth');
            $table->string('website_url', 255)->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('meta_pixel_connections');
        Schema::dropIfExists('company_facebook_accounts');
    }
};
