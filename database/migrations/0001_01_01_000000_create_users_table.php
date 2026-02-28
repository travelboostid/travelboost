<?php

use App\Enums\CompanyType;
use App\Enums\CompanyUserRole;
use App\Enums\CompanyUserStatus;
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
      $table->string('email')->unique();
      $table->timestamp('email_verified_at')->nullable();
      $table->string('password');
      $table->string('username')->unique();
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
      $table->string('landing_page_data')->nullable();
      $table->timestamps();
    });

    Schema::create('company_members', function (Blueprint $table) {
      $table->id();
      $table->foreignId('company_id')->constrained()->cascadeOnDelete();
      $table->foreignId('user_id')->constrained()->cascadeOnDelete();
      $table->enum('status', CompanyUserStatus::cases())->default(CompanyUserStatus::PENDING);
      $table->enum('role', CompanyUserRole::cases())->default(CompanyUserRole::ADMIN);
      $table->timestamps();
      $table->unique(['company_id', 'user_id']);
    });

    Schema::create('company_member_invitations', function (Blueprint $table) {
      $table->id();
      $table->foreignId('company_id')->constrained()->cascadeOnDelete();
      $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
      $table->string('email');
      $table->enum('role', CompanyUserRole::cases())->default(CompanyUserRole::ADMIN);
      $table->timestamps();
      $table->unique(['company_id', 'email']);
    });

    Schema::table('users', function (Blueprint $table) {
      $table->foreignId('company_id')
        ->nullable()
        ->constrained('companies')
        ->cascadeOnDelete();
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
    Schema::dropIfExists('company_member_invitations');
    Schema::dropIfExists('company_members');
    Schema::dropIfExists('companies');
    Schema::dropIfExists('users');
    Schema::dropIfExists('user_preferences');
    Schema::dropIfExists('password_reset_tokens');
    Schema::dropIfExists('sessions');
  }
};
