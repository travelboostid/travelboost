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
        Schema::create('company_google_accounts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('company_id')
                ->unique()
                ->constrained()
                ->cascadeOnDelete();

            $table->string('google_id', 255)->index();
            $table->string('email', 255)->nullable();
            $table->string('name', 255)->nullable();

            $table->longText('access_token')->nullable();
            $table->longText('refresh_token')->nullable();
            $table->json('scopes')->nullable();
            $table->timestamp('expired_at')->nullable();

            $table->timestamps();
        });
        Schema::create('google_analytics_connections', function (Blueprint $table) {
            $table->id();

            $table->foreignId('company_google_account_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('ga_account_id', 255)->nullable(); // accounts/123
            $table->string('property_id', 255)->nullable();   // properties/123
            $table->string('measurement_id', 255)->nullable(); // G-XXXXXXX

            $table->string('website_url', 255)->nullable();
            $table->string('timezone', 100)->default('Asia/Jakarta');
            $table->string('currency', 50)->default('IDR');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::drop('google_analytics_connections');
        Schema::drop('company_google_accounts');
    }
};
