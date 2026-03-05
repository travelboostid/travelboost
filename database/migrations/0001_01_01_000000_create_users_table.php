<?php

use App\Enums\CompanyType;
use App\Enums\CompanyTeamRole;
use App\Enums\CompanyTeamStatus;
use App\Enums\DomainStatus;
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
      $table->string(column: 'address');
      $table->string(column: 'phone');
      $table->rememberToken();
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
      $table->string('email')->unique();
      $table->string(column: 'address');
      $table->string(column: 'phone');
      $table->rememberToken();
      $table->timestamps();
    });

    Schema::create('company_settings', function (Blueprint $table) {
      $table->id();
      $table->foreignId('company_id')->unique()->constrained('companies')->cascadeOnDelete();
      $table->boolean('enable_chatbot')->default(false);
      $table->text('landing_page_data')->nullable();
      $table->timestamps();
    });

    Schema::create('company_teams', function (Blueprint $table) {
      $table->id();
      $table->foreignId('company_id')->constrained()->cascadeOnDelete();
      $table->foreignId('user_id')->constrained()->cascadeOnDelete();
      $table->enum('status', CompanyTeamStatus::cases())->default(CompanyTeamStatus::PENDING);
      $table->enum('role', CompanyTeamRole::cases())->default(CompanyTeamRole::ADMIN);
      $table->timestamps();
      $table->unique(['company_id', 'user_id']);
    });

    Schema::create('vendor_agent_partners', function (Blueprint $table) {
      $table->id();
      $table->foreignId('vendor_id')->constrained('companies')->cascadeOnDelete();
      $table->foreignId('agent_id')->constrained('companies')->cascadeOnDelete();
      $table->enum('status', VendorAgentPartnerStatus::cases())->default(VendorAgentPartnerStatus::PENDING);
      $table->timestamps();
      $table->unique(['vendor_id', 'agent_id']);
    });

    Schema::create('company_team_invitations', function (Blueprint $table) {
      $table->id();
      $table->foreignId('company_id')->constrained()->cascadeOnDelete();
      $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
      $table->string('email');
      $table->enum('role', CompanyTeamRole::cases())->default(CompanyTeamRole::ADMIN);
      $table->timestamps();
      $table->unique(['company_id', 'email']);
    });

    Schema::create('domains', function (Blueprint $table) {
      $table->id();
      $table->foreignId('company_id')->unique()->constrained()->cascadeOnDelete();
      $table->string('domain')->unique();
      $table->enum('status', DomainStatus::cases())->default(DomainStatus::INACTIVE);
      $table->uuid('verification_token')->unique();
      $table->timestamps();
    });

    Schema::table('users', function (Blueprint $table) {
      $table->foreignId('company_id')
        ->nullable()
        ->constrained('companies')
        ->cascadeOnDelete();
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
      $table->dropForeign(['company_id']);
      $table->dropColumn('company_id');
    });
    Schema::dropIfExists('company_team_invitations');
    Schema::dropIfExists('company_teams');
    Schema::dropIfExists('companies');
    Schema::dropIfExists('users');
    Schema::dropIfExists('user_preferences');
    Schema::dropIfExists('password_reset_tokens');
    Schema::dropIfExists('sessions');
  }
};
