<?php

use App\Enums\CompanyType;
use App\Enums\CompanyTeamStatus;
use App\Enums\DomainStatus;
use App\Enums\UserGender;
use App\Enums\UserStatus;
use App\Enums\VendorAgentPartnerStatus;
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
    Schema::create('users', function (Blueprint $table) {
      $table->id();
      $table->string('name');
      $table->string('email'); //->unique() -> we handle this on separate step below;
      $table->timestamp('email_verified_at')->nullable();
      $table->string('password');
      $table->string('username'); //->unique() -> we handle this on separate step below;
      $table->string(column: 'address')->default('');
      $table->string(column: 'phone')->default('');
      $table->enum('gender', UserGender::cases())->default(UserGender::UNSPECIFIED);
      $table->enum('status', UserStatus::cases())->default(UserStatus::INACTIVE);
      $table->string('note')->nullable();
      $table->jsonb('meta')->nullable();
      $table->rememberToken();
      $table->timestamps();
    });

    Schema::create('anonymous_users', function (Blueprint $table) {
      $table->id();
      $table->string('token')->unique();
      $table->timestamps();
    });

    Schema::create('password_reset_tokens', function (Blueprint $table) {
      $table->string('email')->primary();
      $table->string('token');
      $table->timestamp('created_at')->nullable();
    });

    Schema::create('sessions', function (Blueprint $table) {
      $table->string('id')->primary();
      $table->foreignId('user_id')->nullable()->index();
      $table->string('ip_address', 45)->nullable();
      $table->text('user_agent')->nullable();
      $table->longText('payload');
      $table->integer('last_activity')->index();
    });

    Schema::create('companies', function (Blueprint $table) {
      $table->id();
      $table->enum('type', CompanyType::cases());
      $table->string('name');
      $table->string('username')->unique();
      $table->string('subdomain')->unique();
      $table->string('email')->unique();
      $table->string(column: 'address')->default('');
      $table->string(column: 'phone')->default('');
      $table->string(column: 'customer_service_phone')->default('');
      $table->string('note')->nullable();
      $table->jsonb('meta')->nullable();
      $table->rememberToken();
      $table->timestamps();
    });

    Schema::create('ai_models', function (Blueprint $table) {
      $table->id();
      $table->string('code')->unique();
      $table->decimal('input_token_rate', 16, 8)->default(1);
      $table->decimal('output_token_rate', 16, 8)->default(1);
      $table->timestamps();
    });

    Schema::create('company_settings', function (Blueprint $table) {
      $table->id();
      $table->foreignId('company_id')->unique()->constrained('companies')->cascadeOnDelete();
      $table->boolean('chatbot_enabled')->default(false);
      $table->string('chatbot_tone')->default('professional'); // professional | friendly | casual | enthusiastic
      $table->string('chatbot_emoji_usage')->default('minimal'); // none | minimal | moderate | expressive
      $table->string('chatbot_personality')->default('assistant'); // assistant | sales | support | travel_consultant
      $table->string('chatbot_default_language')->default('auto'); // auto | id | en
      $table->foreignId('chatbot_model_id')->nullable()->constrained('ai_models')->nullOnDelete();
      $table->text('landing_page_data')->nullable();
      $table->timestamps();
    });

    Schema::create('agent_subscription_packages', function (Blueprint $table) {
      $table->id();
      $table->string('name'); // e.g. Basic, Pro, Enterprise
      $table->integer('duration_months'); // 1, 3, 6, 12
      $table->decimal('price', 14, 2); // final price after discount
      $table->boolean('is_active')->default(true);
      $table->timestamps();
    });

    Schema::create('agent_subscriptions', function (Blueprint $table) {
      $table->id();
      $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
      $table->foreignId('package_id')->constrained('agent_subscription_packages');
      // lifecycle
      $table->timestamp('started_at')->nullable();
      $table->timestamp('ended_at')->nullable();

      $table->timestamps();
    });

    Schema::create('ai_credits', function (Blueprint $table) {
      $table->id();
      $table->foreignId('company_id')->unique()->constrained('companies')->cascadeOnDelete();
      $table->decimal('balance', 16, 8)->default(0);
      $table->timestamps();
    });

    // Daily billing cycle for AI usage, used for billing and analytics
    Schema::create('ai_billing_cycles', function (Blueprint $table) {
      $table->id();
      $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
      $table->date('date'); // Billing cycle date
      $table->unsignedInteger('input_tokens')->default(0);
      $table->unsignedInteger('output_tokens')->default(0);
      $table->decimal('cost', 16, 8)->default(0);
      $table->timestamp('charged_at')->nullable(); // When the cost was charged to the company
      $table->timestamps();

      $table->unique(['company_id', 'date']);
    });

    // AI usage logs for each request, linked to billing cycle
    Schema::create('ai_usage_logs', function (Blueprint $table) {
      $table->id();
      $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
      $table->foreignId('model_id')->constrained('ai_models')->nullOnDelete();
      $table->unsignedInteger('input_tokens')->default(0);
      $table->unsignedInteger('output_tokens')->default(0);
      $table->decimal('cost', 16, 8)->default(0);
      $table->string('feature')->nullable();
      $table->json('meta')->nullable();
      $table->foreignId('billing_cycle_id')->nullable()->constrained('ai_billing_cycles')->nullOnDelete();
      $table->timestamps();

      $table->index(['company_id']);
    });

    Schema::create('company_teams', function (Blueprint $table) {
      $table->id();
      $table->foreignId('company_id')->constrained()->cascadeOnDelete();
      $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
      $table->boolean('is_owner')->default(false);
      $table->string('invite_email')->nullable();
      $table->string('invite_role')->nullable(); // initial role name
      $table->uuid('invite_token')->nullable()->unique();
      $table->timestamp('invited_at')->nullable();
      $table->timestamp('accepted_at')->nullable();
      $table->enum('status', CompanyTeamStatus::cases())->default(CompanyTeamStatus::PENDING);
      $table->timestamps();

      $table->unique(['company_id', 'user_id']);
    });

    Schema::create('vendor_agent_partners', function (Blueprint $table) {
      $table->id();
      $table->foreignId('vendor_id')->constrained('companies')->cascadeOnDelete();
      $table->foreignId('agent_id')->constrained('companies')->cascadeOnDelete();
      $table->enum('status', VendorAgentPartnerStatus::cases())->default(VendorAgentPartnerStatus::PENDING);
      $table->timestamp('applied_at')->nullable();
      $table->timestamp('accepted_at')->nullable();
      $table->string('note', 1000)->nullable();
      $table->timestamps();

      $table->unique(['vendor_id', 'agent_id']);
    });

    Schema::create('domains', function (Blueprint $table) {
      $table->id();
      $table->foreignId('company_id')->unique()->constrained('companies')->cascadeOnDelete();
      $table->string('domain')->unique();
      $table->enum('status', DomainStatus::cases())->default(DomainStatus::PENDING);
      $table->uuid('verification_token')->unique();
      $table->timestamps();
    });

    // Add company_id to users table and set up unique constraints for email and username within the same company
    Schema::table('users', function (Blueprint $table) {
      $table->foreignId('company_id')->nullable()->constrained('companies')->cascadeOnDelete();
      $table->unique(['company_id', 'email']);
      $table->unique(['company_id', 'username']);
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('users', function (Blueprint $table) {
      $table->dropUnique(['company_id', 'email']);
      $table->dropUnique(['company_id', 'username']);
      $table->dropForeign(['company_id']);
      $table->dropColumn('company_id');
    });
    Schema::dropIfExists('domains');
    Schema::dropIfExists('vendor_agent_partners');
    Schema::dropIfExists('company_teams');
    Schema::dropIfExists('ai_usage_logs');
    Schema::dropIfExists('ai_billing_cycles');
    Schema::dropIfExists('ai_credits');
    Schema::dropIfExists('ai_models');
    Schema::dropIfExists('agent_subscriptions');
    Schema::dropIfExists('agent_subscription_packages');
    Schema::dropIfExists('company_settings');
    Schema::dropIfExists('companies');
    Schema::dropIfExists('anonymous_users');
    Schema::dropIfExists('sessions');
    Schema::dropIfExists('password_reset_tokens');
    Schema::dropIfExists('users');
  }
};
