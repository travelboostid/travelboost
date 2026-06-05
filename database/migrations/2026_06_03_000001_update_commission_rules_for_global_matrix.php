<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tour_commission_rules', function (Blueprint $table): void {
            $table->foreignId('company_id')
                ->nullable()
                ->after('id')
                ->constrained('companies')
                ->cascadeOnDelete();
        });

        DB::statement('UPDATE tour_commission_rules SET company_id = tours.company_id FROM tours WHERE tour_commission_rules.tour_id = tours.id');

        Schema::table('tour_commission_rules', function (Blueprint $table): void {
            $table->dropUnique('tour_commission_rules_unique');
            $table->unsignedBigInteger('company_id')->nullable(false)->change();
            $table->unsignedBigInteger('tour_id')->nullable()->change();
        });

        DB::statement('CREATE UNIQUE INDEX tour_commission_rules_global_unique ON tour_commission_rules (company_id, agent_tier_id, product_commission_category_id) WHERE tour_id IS NULL');
        DB::statement('CREATE UNIQUE INDEX tour_commission_rules_tour_unique ON tour_commission_rules (tour_id, agent_tier_id, product_commission_category_id) WHERE tour_id IS NOT NULL');

        Schema::create('tour_commission_additional_rules', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('agent_tier_id')->constrained('agent_tiers')->cascadeOnDelete();
            $table->foreignId('product_commission_category_id')->nullable()->constrained('product_commission_categories')->cascadeOnDelete();
            $table->foreignId('tour_id')->nullable()->constrained('tours')->cascadeOnDelete();
            $table->foreignId('tour_schedule_id')->nullable()->constrained('tour_schedules')->cascadeOnDelete();
            $table->date('departure_date')->nullable();
            $table->string('scope_type', 30);
            $table->string('commission_type', 20)->default('percent');
            $table->decimal('commission_value', 15, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['company_id', 'agent_tier_id', 'scope_type'], 'tour_commission_additional_lookup');
            $table->unique(['company_id', 'agent_tier_id', 'product_commission_category_id', 'departure_date'], 'tour_commission_additional_category_unique');
            $table->unique(['company_id', 'agent_tier_id', 'tour_schedule_id'], 'tour_commission_additional_schedule_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tour_commission_additional_rules');

        DB::statement('DROP INDEX IF EXISTS tour_commission_rules_global_unique');
        DB::statement('DROP INDEX IF EXISTS tour_commission_rules_tour_unique');

        DB::table('tour_commission_rules')->whereNull('tour_id')->delete();

        Schema::table('tour_commission_rules', function (Blueprint $table): void {
            $table->unsignedBigInteger('tour_id')->nullable(false)->change();
            $table->unique(['tour_id', 'agent_tier_id', 'product_commission_category_id'], 'tour_commission_rules_unique');
            $table->dropConstrainedForeignId('company_id');
        });
    }
};
