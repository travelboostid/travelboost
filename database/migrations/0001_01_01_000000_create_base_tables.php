<?php

use App\Enums\BankAccountStatus;
use App\Enums\BookingStatus;
use App\Enums\CompanyType;
use App\Enums\CompanyTeamStatus;
use App\Enums\MediaType;
use App\Enums\PaymentStatus;
use App\Enums\UserGender;
use App\Enums\UserStatus;
use App\Enums\VendorAgentPartnerStatus;
use App\Enums\WithdrawalStatus;
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
    Schema::create('app_configs', function (Blueprint $table) {
      $table->id();
      $table->string('key')->unique();
      $table->string('description')->nullable();
      $table->jsonb('value')->nullable();
      $table->timestamps();
    });
    // BEGIN Laravolt Indonesia tables
    Schema::connection(config('indonesia.database.connection') ?? config('database.default'))->create(config('laravolt.indonesia.table_prefix') . 'provinces', function (Blueprint $table) {
      $table->bigIncrements('id');
      $table->char('code', 2)->unique();
      $table->string('name', 255);
      $table->text('meta')->nullable();
      $table->timestamps();
    });

    Schema::connection(config('indonesia.database.connection') ?? config('database.default'))->create(config('laravolt.indonesia.table_prefix') . 'cities', function (Blueprint $table) {
      $table->bigIncrements('id');
      $table->char('code', 4)->unique();
      $table->char('province_code', 2);
      $table->string('name', 255);
      $table->text('meta')->nullable();
      $table->timestamps();

      $table->foreign('province_code')
        ->references('code')
        ->on(config('laravolt.indonesia.table_prefix') . 'provinces')
        ->onUpdate('cascade')->onDelete('restrict');
    });

    Schema::connection(config('indonesia.database.connection') ?? config('database.default'))->create(config('laravolt.indonesia.table_prefix') . 'districts', function (Blueprint $table) {
      $table->bigIncrements('id');
      $table->char('code', 7)->unique();
      $table->char('city_code', 4);
      $table->string('name', 255);
      $table->text('meta')->nullable();
      $table->timestamps();

      $table->foreign('city_code')
        ->references('code')
        ->on(config('laravolt.indonesia.table_prefix') . 'cities')
        ->onUpdate('cascade')->onDelete('restrict');
    });

    Schema::connection(config('indonesia.database.connection') ?? config('database.default'))->create(config('laravolt.indonesia.table_prefix') . 'villages', function (Blueprint $table) {
      $table->bigIncrements('id');
      $table->char('code', 10)->unique();
      $table->char('district_code', 7);
      $table->string('name', 255);
      $table->text('meta')->nullable();
      $table->timestamps();

      $table->foreign('district_code')
        ->references('code')
        ->on(config('laravolt.indonesia.table_prefix') . 'districts')
        ->onUpdate('cascade')->onDelete('restrict');
    });
    // END Laravolt Indonesia tables

    Schema::create('users', function (Blueprint $table) {
      $table->id();
      $table->string('name');
      $table->string('email'); //->unique() -> we handle this on separate step below;
      $table->timestamp('email_verified_at')->nullable();
      $table->string('username'); //->unique() -> we handle this on separate step below;
      $table->string(column: 'address')->default('');
      $table->string(column: 'phone')->default('');
      $table->enum('gender', UserGender::cases())->default(UserGender::UNSPECIFIED);
      $table->enum('status', UserStatus::cases())->default(UserStatus::INACTIVE);
      $table->string('password');
      $table->text('two_factor_secret')->nullable();
      $table->text('two_factor_recovery_codes')->nullable();
      $table->timestamp('two_factor_confirmed_at')->nullable();
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


    Schema::create('cache', function (Blueprint $table) {
      $table->string('key')->primary();
      $table->mediumText('value');
      $table->integer('expiration')->index();
    });

    Schema::create('cache_locks', function (Blueprint $table) {
      $table->string('key')->primary();
      $table->string('owner');
      $table->integer('expiration')->index();
    });

    Schema::create('jobs', function (Blueprint $table) {
      $table->id();
      $table->string('queue')->index();
      $table->longText('payload');
      $table->unsignedTinyInteger('attempts');
      $table->unsignedInteger('reserved_at')->nullable();
      $table->unsignedInteger('available_at');
      $table->unsignedInteger('created_at');
    });

    Schema::create('job_batches', function (Blueprint $table) {
      $table->string('id')->primary();
      $table->string('name');
      $table->integer('total_jobs');
      $table->integer('pending_jobs');
      $table->integer('failed_jobs');
      $table->longText('failed_job_ids');
      $table->mediumText('options')->nullable();
      $table->integer('cancelled_at')->nullable();
      $table->integer('created_at');
      $table->integer('finished_at')->nullable();
    });

    Schema::create('failed_jobs', function (Blueprint $table) {
      $table->id();
      $table->string('uuid')->unique();
      $table->text('connection');
      $table->text('queue');
      $table->longText('payload');
      $table->longText('exception');
      $table->timestamp('failed_at')->useCurrent();
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
      $table->string('address')->default('');
      $table->string('phone')->default('');
      $table->string('customer_service_phone')->default('');
      $table->foreignId('province_id')->nullable()->constrained(config('laravolt.indonesia.table_prefix') . 'provinces')->nullOnDelete();
      $table->foreignId('city_id')->nullable()->constrained(config('laravolt.indonesia.table_prefix') . 'cities')->nullOnDelete();
      $table->foreignId('district_id')->nullable()->constrained(config('laravolt.indonesia.table_prefix') . 'districts')->nullOnDelete();
      $table->foreignId('village_id')->nullable()->constrained(config('laravolt.indonesia.table_prefix') . 'villages')->nullOnDelete();
      $table->string('province')->default(''); // snapshot
      $table->string('city')->default(''); // snapshot
      $table->string('district')->nullable(); // snapshot
      $table->string('village')->nullable(); // snapshot
      $table->string('postal_code')->nullable();
      $table->string('identity_number', 16)->nullable();

      $table->string('note')->nullable();
      $table->jsonb('meta')->nullable();
      $table->rememberToken();
      $table->timestamps();
    });

    Schema::create('medias', function (Blueprint $table) {
      $table->id();
      $table->string('name', 255);
      $table->string('description', 1000)->nullable();
      $table->enum('type', MediaType::cases()); // Enum will be stored as string
      $table->string('subtype', 50)->default('other');
      $table->json('data')->nullable();
      $table->morphs('owner'); // creates owner_id + owner_type
      $table->timestamps();
    });

    Schema::table('users', function (Blueprint $table) {
      $table->foreignId('photo_id')
        ->nullable()
        ->constrained('medias')
        ->nullOnDelete();
    });
    Schema::table('companies', function (Blueprint $table) {
      $table->foreignId('logo_id')
        ->nullable()
        ->constrained('medias')
        ->nullOnDelete();
      $table->foreignId('photo_id')
        ->nullable()
        ->constrained('medias')
        ->nullOnDelete();
      //09042026
      $table->foreignId('identity_card_id')
        ->nullable()
        ->constrained('medias')
        ->nullOnDelete();
    });

    Schema::create('company_settings', function (Blueprint $table) {
      $table->id();
      $table->foreignId('company_id')->unique()->constrained('companies')->cascadeOnDelete();
      $table->boolean('chatbot_enabled')->default(true);
      $table->string('chatbot_response_style')->default('professional'); // professional | friendly | casual
      $table->string('chatbot_default_language')->default('auto'); // auto | id | en
      $table->text('landing_page_data')->nullable();
      $table->integer('booking_deadline')->default(0);
      $table->decimal('minimum_down_payment', 5, 2)->default(0);
      $table->decimal('minimum_vat', 5, 2)->default(0);
      $table->text('term_conditions')->nullable();
      $table->integer('booking_entry_time_limit')->default(0);
      $table->string('manual_bank_transfer')->nullable();
      $table->string('manual_bank_transfer_account_name')->nullable();
      $table->string('manual_bank_transfer_account_number')->nullable();
      $table->string('email_payment_gateway')->nullable();
      $table->string('password_payment_gateway')->nullable();
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


    // AI usage logs for each request, linked to billing cycle
    Schema::create('ai_usage_logs', function (Blueprint $table) {
      $table->id();
      $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
      $table->unsignedInteger('embedding_tokens')->default(0);
      $table->unsignedInteger('prompt_tokens')->default(0);
      $table->unsignedInteger('completion_tokens')->default(0);
      $table->decimal('usage_cost', 16, 8)->default(0); // cost calculated from token rates
      $table->decimal('user_cost', 16, 8)->default(0);  // cost charged to user
      $table->string('feature')->nullable();
      $table->json('meta')->nullable();
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
      $table->morphs('owner'); // owner_type (Company, User), owner_id
      $table->string('subdomain')->nullable()->unique();
      $table->string('domain')->nullable()->unique();
      $table->boolean('domain_enabled')->default(false);
      $table->timestamps();

      $table->index(['subdomain']);
      $table->index(['domain']);
    });

    // Add company_id to users table and set up unique constraints for email and username within the same company
    Schema::table('users', function (Blueprint $table) {
      $table->foreignId('company_id')->nullable()->constrained('companies')->cascadeOnDelete();
      $table->unique(['company_id', 'email']);
      $table->unique(['company_id', 'username']);
    });

    Schema::create('continents', function (Blueprint $table) {
      $table->id();
      $table->timestamps();
      $table->string('name');
    });

    Schema::create('regions', function (Blueprint $table) {
      $table->id();
      $table->timestamps();
      $table->string('name');
      $table->foreignId('continent_id')
        ->constrained('continents')
        ->cascadeOnDelete();
    });

    Schema::create('countries', function (Blueprint $table) {
      $table->id();
      $table->timestamps();
      $table->string('name');
      $table->foreignId('continent_id')
        ->constrained('continents')
        ->cascadeOnDelete();
      $table->foreignId('region_id')
        ->constrained('regions')
        ->cascadeOnDelete();
    });

    Schema::create('tour_categories', function (Blueprint $table) {
      $table->id();
      $table->string('name')->unique();
      $table->text('description')->nullable();
      $table->unsignedInteger('position_no')->default(0);
      $table->foreignId('company_id')
        ->constrained('companies')
        ->cascadeOnDelete();
      $table->timestamps();
      $table->unique(['company_id', 'name']);
    });

    Schema::create('tours', function (Blueprint $table) {
      $table->id();
      $table->string('code');
      $table->string('name');
      $table->text('description')->nullable();
      $table->unsignedInteger('duration_days');
      $table->string('status')->default('active');
      $table->string('destination');
      $table->string('continent_name')->nullable();
      $table->string('region_name')->nullable();
      $table->string('country_name')->nullable();
      $table->decimal('showprice', 15, 2)->default(0);
      $table->decimal('earlybird', 15, 2)->default(0);
      $table->string('earlybird_note')->default('');
      $table->string('currency')->default('');
      $table->decimal('promoprice', 15, 2)->default(0)->after('showprice');
      $table->string('promote_title')->nullable()->after('earlybird');
      $table->decimal('promote_price', 15, 2)->default(0)->after('promote_title');
      $table->string('promote_note')->nullable()->after('promote_price');
      $table->foreignId('company_id')
        ->constrained('companies')
        ->cascadeOnDelete();
      $table->foreignId('category_id')
        ->nullable()
        ->constrained('tour_categories')
        ->cascadeOnDelete();
      $table->foreignId('image_id')
        ->nullable()
        ->constrained('medias')
        ->nullOnDelete();
      $table->foreignId(column: 'document_id')
        ->nullable()
        ->constrained('medias')
        ->nullOnDelete();
      $table->timestamps();
      $table->unique(['code', 'company_id']);
      $table->index('status');
      $table->foreignId('continent_id')
        ->nullable()
        ->constrained('continents')
        ->cascadeOnDelete();
      $table->foreignId('region_id')
        ->nullable()
        ->constrained('regions')
        ->cascadeOnDelete();
      $table->foreignId('country_id')
        ->nullable()
        ->constrained('countries')
        ->cascadeOnDelete();
    });

    Schema::create('agent_tours', function (Blueprint $table) {
      $table->id();
      $table->foreignId('company_id')
        ->constrained('companies')
        ->cascadeOnDelete();
      $table->foreignId('category_id')
        ->nullable()
        ->constrained('tour_categories')
        ->cascadeOnDelete();
      $table->foreignId('tour_id')
        ->constrained('tours')
        ->cascadeOnDelete();
      // created_at, updated_at
      $table->timestamps();
    });

    Schema::create('tour_document_knowledge_bases', function (Blueprint $table) {
      $table->id();
      $table->foreignId('tour_id')
        ->constrained('tours')
        ->cascadeOnDelete();
      $table->text('content');
      $table->vector('embedding', dimensions: 1536);
      $table->timestamps();
    });

    Schema::create('tour_schedules', function (Blueprint $table) {
      $table->id();
      $table->foreignId('tour_id')
        ->constrained('tours')
        ->cascadeOnDelete();
      $table->string('tour_code')->nullable();
      $table->foreignId('company_id')
        ->constrained('companies')
        ->cascadeOnDelete();
      // Dates
      $table->date('departure_date');
      $table->date('return_date')->nullable();
      
      // Booking control
      $table->date('cutoff_date')->nullable();
      // Status
      $table->boolean('is_active')->default(true);
      // Notes
      $table->string('note')->nullable();
      $table->timestamps();
    });

    Schema::create('price_categories', function (Blueprint $table) {
      $table->id();

      $table->foreignId('company_id')
        ->constrained('companies')
        ->cascadeOnDelete();

      $table->string('name');
      $table->string('room_type');
      $table->text('description')->nullable();

      $table->timestamps();

      $table->unique(['company_id', 'name']);
    });

    Schema::create('tour_prices', function (Blueprint $table) {
      $table->id();

      $table->foreignId('company_id')
        ->constrained('companies')
        ->cascadeOnDelete();

      $table->string('tour_code')->nullable();

      $table->foreignId('schedule_id')
        ->constrained('tour_schedules')
        ->cascadeOnDelete();

      $table->foreignId('price_category_id')
        ->constrained('price_categories')
        ->cascadeOnDelete();

      $table->string('currency');
      $table->decimal('price', 12, 2)->nullable();
      $table->decimal('promotion_rate', 12, 2)->default(0);
      $table->decimal('promotion', 12, 2)->default(0);
      $table->decimal('commission_rate', 12, 2)->default(0);
      $table->decimal('commission', 12, 2)->default(0);

      $table->timestamps();
    });

    Schema::create('tour_add_ons', function (Blueprint $table) {
      $table->id();
      $table->foreignId('company_id')
        ->constrained('companies')
        ->cascadeOnDelete();
      $table->foreignId('tour_id')
        ->constrained('tours')
        ->cascadeOnDelete();
      $table->foreignId('schedule_id')
        ->constrained('tour_schedules')
        ->cascadeOnDelete();
      $table->string('description');
      $table->decimal('price', 12, 2)->nullable();
      $table->boolean('edit_status')->default(false)->after('price');
      $table->timestamps();

      $table->unique(['company_id', 'schedule_id', 'description'], 'tour_add_ons_unique');
    });

    Schema::create('tour_availabilities', function (Blueprint $table) {
      $table->id();

      $table->foreignId('company_id')
        ->constrained('companies')
        ->cascadeOnDelete();

      $table->foreignId('tour_id')
        ->constrained('tours')
        ->cascadeOnDelete();

      $table->foreignId('schedule_id')
        ->constrained('tour_schedules')
        ->cascadeOnDelete();

      $table->unsignedInteger('max_pax')->default(0);
      $table->unsignedInteger('RS')->default(0);
      $table->unsignedInteger('WP')->default(0);
      $table->unsignedInteger('DP')->default(0);
      $table->unsignedInteger('FP')->default(0);
      $table->unsignedInteger('WA')->default(0);
      $table->unsignedInteger('BRS')->default(0);
      $table->unsignedInteger('CA')->default(0);
      $table->unsignedInteger('RF')->default(0);
      $table->unsignedInteger('EX')->default(0);
      $table->unsignedInteger('WL')->default(0);
      $table->unsignedInteger('available')->default(0);

      $table->timestamps();
    });

    Schema::create('currencies', function (Blueprint $table) {
      $table->id();
      $table->string('code', 3)->unique(); // USD
      $table->string('name')->nullable();  // US Dollar
      $table->timestamps();
    });

    Schema::create('chat_rooms', function (Blueprint $table) {
      $table->id();
      $table->enum('type', ['private', 'group'])->default('private');
      $table->string('name')->nullable(); // For group chats
      $table->timestamps();
    });

    Schema::create('chat_room_members', function (Blueprint $table) {
      $table->id();
      $table->foreignId('room_id')
        ->constrained('chat_rooms')
        ->cascadeOnDelete();
      $table->morphs('member'); // member_id + member_type (User, Anonymous User, or Company)
      $table->enum('role', ['member', 'admin', 'owner'])->default('member');
      $table->timestamp('joined_at')->useCurrent();
      $table->timestamp('last_read_at')->nullable();
      $table->timestamps();

      $table->unique(['room_id', 'member_id', 'member_type']); // Prevent duplicate memberships
    });

    Schema::create('chat_messages', function (Blueprint $table) {
      $table->id();
      $table->boolean('is_bot')->default(false);
      $table->text('message')->nullable();
      $table->string('attachment_data')->nullable(); // File/image/video path
      $table->string('attachment_type')->nullable(); // 'image', 'video', 'file', etc.
      $table->jsonb('meta')->nullable(); // For storing additional info
      $table->timestamps();
      $table->foreignId('room_id')
        ->constrained('chat_rooms')
        ->cascadeOnDelete();
      $table->foreignId('user_id')
        ->nullable()
        ->constrained('users')
        ->cascadeOnDelete();
      $table->nullableMorphs('sender'); // sender_type + sender_id

      $table->foreignId('reply_to')
        ->nullable()
        ->constrained('chat_messages')
        ->nullOnDelete();
      $table->index(['room_id', 'created_at']); // For faster room message queries
    });

    Schema::table('chat_rooms', function (Blueprint $table) {
      $table->foreignId('last_message_id')->nullable()->constrained('chat_messages')->nullOnDelete();
    });

    Schema::create('payments', function (Blueprint $table) {
      $table->id();
      $table->morphs('owner'); // creates owner_id + owner_type
      $table->morphs('payable'); // polymorphic: order, wallet_topup, etc
      $table->string('provider'); // midtrans, stripe, xendit, etc
      $table->string('payment_method')->nullable(); // snap, gopay, va, credit_card, etc
      $table->decimal('amount', 14, 2); // IDR, store as integer-like decimal
      $table->enum('status', PaymentStatus::cases())->default(PaymentStatus::UNPAID->value); // unpaid | pending | paid | failed | expired | refunded
      $table->json('payload')->nullable(); // Raw webhook / gateway payload
      $table->timestamp('paid_at')->nullable(); // When payment is successfully completed
      $table->timestamps();

      $table->index(['provider', 'status']);
    });

    Schema::create('wallet_topup_payments', function (Blueprint $table) {
      $table->id();
      $table->decimal('amount', 14, 2);
      $table->timestamps();
    });

    Schema::create('agent_subscription_payments', function (Blueprint $table) {
      $table->id();
      $table->foreignId('package_id')->constrained('agent_subscription_packages');
      $table->timestamps();
    });

    Schema::create('bank_accounts', function (Blueprint $table) {
      $table->id();
      $table->morphs('owner'); // creates owner_id + owner_type
      $table->string('provider'); // BCA, BNI, MANDIRI, OVO, GOPAY
      $table->string('account_number');
      $table->string('account_name');
      $table->string('branch')->nullable();
      $table->enum('status', BankAccountStatus::cases())->default(BankAccountStatus::PENDING);
      $table->boolean('is_default')->default(false); // mark default destination
      $table->timestamps();
    });

    Schema::create('withdrawals', function (Blueprint $table) {
      $table->id();
      $table->morphs('owner'); // creates owner_id + owner_type
      $table->foreignId('bank_account_id')->constrained('bank_accounts')->restrictOnDelete();
      $table->integer('wallet_id')->nullable();
      $table->decimal('amount', 18, 2);
      $table->enum('status', WithdrawalStatus::cases())->default(WithdrawalStatus::REQUESTED);
      $table->text('note')->nullable();
      $table->timestamp('approved_at')->nullable();
      $table->timestamp('processed_at')->nullable();
      $table->timestamp('paid_at')->nullable();
      $table->timestamps();
      $table->index(['bank_account_id']);
      $table->index(['wallet_id']);
    });

    Schema::create('notifications', function (Blueprint $table) {
      $table->uuid('id')->primary();
      $table->string('type');
      $table->morphs('notifiable');
      $table->text('data');
      $table->timestamp('read_at')->nullable();
      $table->timestamps();
    });

    Schema::create('affiliate_profiles', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
      // Upline adalah User ID milik atasan (Partner/MA)
      $table->foreignId('upline_id')->nullable()->constrained('users')->onDelete('set null');
      $table->string('profile_photo_path')->nullable()->after('identity_photo_path');
      $table->enum('tier', ['partner', 'master_affiliate', 'affiliate']);
      $table->enum('status', ['pending', 'approved', 'rejected', 'suspended'])->default('pending');
      $table->string('phone')->nullable()->after('tier');
      $table->text('address')->nullable()->after('phone');
      $table->string('province')->nullable()->after('address');
      $table->string('city')->nullable()->after('province');
      $table->string('district')->nullable()->after('city');
      $table->string('village')->nullable()->after('district');
      $table->string('postal_code')->nullable()->after('village');
      $table->string('identity_number')->nullable()->after('postal_code'); // KTP/SIM/Paspor
      $table->string('identity_photo_path')->nullable()->after('identity_number'); // Foto KTP
      $table->string('referral_code')->unique();
      $table->timestamp('approved_at')->nullable();
      $table->timestamps();
    });

    Schema::create('affiliate_commission_rates', function (Blueprint $table) {
      $table->id();
      $table->enum('tier', ['partner', 'master_affiliate', 'affiliate']);
      $table->decimal('percentage', 5, 2); // Contoh: 15.00
      $table->boolean('is_active')->default(true);
      $table->timestamps();
    });

    Schema::table('companies', function (Blueprint $table) {
      // referred_by menyimpan User ID milik Afiliator yang mengundang
      $table->foreignId('referred_by')->nullable()->constrained('users')->onDelete('set null');
    });

    Schema::create('bookings', function (Blueprint $table) {
      $table->id();
      $table->string('booking_number')->unique();
      $table->foreignId('user_id')->constrained('users');
      $table->foreignId('vendor_id')->nullable()->constrained('companies');
      $table->foreignId('agent_id')->nullable()->constrained('companies');
      $table->foreignId('tour_id')->constrained('tours');
      $table->date('departure_date');
      $table->string('status')->default(BookingStatus::AWAITING_PAYMENT->value);
      $table->integer('pax_adult')->default(0);
      $table->integer('pax_child')->default(0);
      $table->integer('pax_infant')->default(0);
      $table->decimal('total_price', 15, 2)->default(0);
      $table->decimal('tax_amount', 15, 2)->default(0);
      $table->decimal('platform_fee', 15, 2)->default(0);
      $table->decimal('commission_amount', 15, 2)->default(0);
      $table->decimal('grand_total', 15, 2)->default(0);
      $table->timestamps();
    });

    Schema::create('booking_passengers', function (Blueprint $table) {
      $table->id();
      $table->foreignId('booking_id')->constrained('bookings')->cascadeOnDelete();
      $table->string('first_name');
      $table->string('last_name')->nullable();
      $table->string('gender')->default(UserGender::UNSPECIFIED->value);
      $table->date('dob')->nullable();
      $table->string('pob')->nullable();
      $table->string('room_type')->nullable();
      $table->string('room_number')->nullable();
      $table->string('passport_file_path')->nullable();
      $table->string('visa_file_path')->nullable();
      $table->timestamps();
    });

    Schema::create('booking_addons', function (Blueprint $table) {
      $table->id();
      $table->foreignId('booking_id')->constrained('bookings')->cascadeOnDelete();
      $table->string('name');
      $table->decimal('price', 15, 2);
      $table->timestamps();
    });

    Schema::create('saved_passengers', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
      $table->string('first_name');
      $table->string('last_name')->nullable();
      $table->string('gender')->default(UserGender::UNSPECIFIED->value);
      $table->date('dob')->nullable();
      $table->string('pob')->nullable();
      $table->string('passport_number')->nullable();
      $table->timestamps();
    });

    Schema::create('agent_conversations', function (Blueprint $table) {
      $table->string('id', 36)->primary();
      $table->foreignId('user_id');
      $table->string('title');
      $table->timestamps();

      $table->index(['user_id', 'updated_at']);
    });

    Schema::create('agent_conversation_messages', function (Blueprint $table) {
      $table->string('id', 36)->primary();
      $table->string('conversation_id', 36)->index();
      $table->foreignId('user_id');
      $table->string('agent');
      $table->string('role', 25);
      $table->text('content');
      $table->text('attachments');
      $table->text('tool_calls');
      $table->text('tool_results');
      $table->text('usage');
      $table->text('meta');
      $table->timestamps();

      $table->index(['conversation_id', 'user_id', 'updated_at'], 'conversation_index');
      $table->index(['user_id']);
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('agent_conversations');
    Schema::dropIfExists('agent_conversation_messages');
    Schema::dropIfExists('saved_passengers');
    Schema::dropIfExists('booking_addons');
    Schema::dropIfExists('booking_passengers');
    Schema::dropIfExists('bookings');
    Schema::dropIfExists('affiliate_commission_rates');
    Schema::dropIfExists('affiliate_profiles');
    Schema::dropIfExists('notifications');
    Schema::dropIfExists('withdrawals');
    Schema::dropIfExists('bank_accounts');
    Schema::dropIfExists('agent_subscription_payments');
    Schema::dropIfExists('wallet_topup_payments');
    Schema::dropIfExists('payments');
    Schema::table('chat_rooms', function (Blueprint $table) {
      $table->dropForeign(['last_message_id']);
      $table->dropColumn('last_message_id');
    });
    Schema::dropIfExists('chat_messages');
    Schema::dropIfExists('chat_room_members');
    Schema::dropIfExists('chat_rooms');
    Schema::dropIfExists('currencies');
    Schema::dropIfExists('tour_availabilities');
    Schema::dropIfExists('tour_add_ons');
    Schema::dropIfExists('tour_prices');
    Schema::dropIfExists('price_categories');
    Schema::dropIfExists('tour_schedules');
    Schema::dropIfExists('tour_document_knowledge_bases');
    Schema::dropIfExists('agent_tours');
    Schema::dropIfExists('tours');
    Schema::dropIfExists('tour_categories');
    Schema::dropIfExists('countries');
    Schema::dropIfExists('regions');
    Schema::dropIfExists('continents');
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
    Schema::dropIfExists('ai_credits');
    Schema::dropIfExists('agent_subscriptions');
    Schema::dropIfExists('agent_subscription_packages');
    Schema::dropIfExists('company_settings');
    Schema::table('companies', function (Blueprint $table) {
      $table->dropForeign(['identity_card_id']);
      $table->dropColumn('identity_card_id');
      $table->dropForeign(['photo_id']);
      $table->dropColumn('photo_id');
      $table->dropForeign(['logo_id']);
      $table->dropColumn('logo_id');
      $table->dropForeign(['referred_by']);
      $table->dropColumn('referred_by');
    });
    Schema::table('users', function (Blueprint $table) {
      $table->dropForeign(['photo_id']);
      $table->dropColumn('photo_id');
    });
    Schema::dropIfExists('medias');
    Schema::dropIfExists('companies');
    Schema::dropIfExists('sessions');
    Schema::dropIfExists('password_reset_tokens');
    Schema::dropIfExists('jobs');
    Schema::dropIfExists('job_batches');
    Schema::dropIfExists('failed_jobs');
    Schema::dropIfExists('cache');
    Schema::dropIfExists('cache_locks');
    Schema::dropIfExists('anonymous_users');
    Schema::dropIfExists('users');
    Schema::drop(config('laravolt.indonesia.table_prefix') . 'villages');
    Schema::drop(config('laravolt.indonesia.table_prefix') . 'districts');
    Schema::drop(config('laravolt.indonesia.table_prefix') . 'cities');
    Schema::drop(config('laravolt.indonesia.table_prefix') . 'provinces');
    //Schema::dropIfExists('app_configs');
  }
};
