<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agent_tiers', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['company_id', 'slug']);
        });

        Schema::table('product_commission_categories', function (Blueprint $table): void {
            $table->foreignId('company_id')
                ->nullable()
                ->after('id')
                ->constrained('companies')
                ->cascadeOnDelete();
            $table->string('slug')->nullable()->after('description');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->unique(['company_id', 'slug']);
        });

        Schema::table('vendor_agent_partners', function (Blueprint $table): void {
            $table->foreignId('agent_tier_id')
                ->nullable()
                ->after('agent_id')
                ->constrained('agent_tiers')
                ->nullOnDelete();
        });

        Schema::create('tour_commission_rules', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tour_id')->constrained('tours')->cascadeOnDelete();
            $table->foreignId('agent_tier_id')->constrained('agent_tiers')->cascadeOnDelete();
            $table->foreignId('product_commission_category_id')->constrained('product_commission_categories')->cascadeOnDelete();
            $table->string('commission_type', 20)->default('percent');
            $table->decimal('commission_value', 15, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['tour_id', 'agent_tier_id', 'product_commission_category_id'], 'tour_commission_rules_unique');
        });

        Schema::create('tour_commission_rule_schedule_adjustments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tour_commission_rule_id')->constrained('tour_commission_rules')->cascadeOnDelete();
            $table->foreignId('tour_schedule_id')->constrained('tour_schedules')->cascadeOnDelete();
            $table->string('commission_type', 20)->default('percent');
            $table->decimal('commission_value', 15, 2)->default(0);
            $table->timestamps();
            $table->unique(['tour_commission_rule_id', 'tour_schedule_id'], 'tour_commission_rule_schedule_unique');
        });

        $now = now();
        $vendors = DB::table('companies')->where('type', 'vendor')->get(['id']);

        foreach ($vendors as $vendor) {
            $tierRows = collect(['Whole Seller', 'Seller Besar', 'Seller Umum'])
                ->map(function (string $name, int $index) use ($vendor, $now): array {
                    return [
                        'company_id' => $vendor->id,
                        'name' => $name,
                        'slug' => Str::slug($name),
                        'sort_order' => $index + 1,
                        'is_active' => true,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                })
                ->all();

            $categoryRows = collect(['Produk Umum', 'Promo', 'Super Promo'])
                ->map(function (string $name, int $index) use ($vendor, $now): array {
                    return [
                        'company_id' => $vendor->id,
                        'category_name' => $name,
                        'slug' => Str::slug($name),
                        'sort_order' => $index + 1,
                        'is_active' => true,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                })
                ->all();

            DB::table('agent_tiers')->insertOrIgnore($tierRows);
            DB::table('product_commission_categories')->insertOrIgnore($categoryRows);

            $defaultCategoryId = DB::table('product_commission_categories')
                ->where('company_id', $vendor->id)
                ->where('slug', 'produk-umum')
                ->value('id');

            if ($defaultCategoryId) {
                DB::table('tours')
                    ->where('company_id', $vendor->id)
                    ->whereNull('product_commission_category_id')
                    ->update(['product_commission_category_id' => $defaultCategoryId]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('tour_commission_rule_schedule_adjustments');
        Schema::dropIfExists('tour_commission_rules');

        Schema::table('vendor_agent_partners', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('agent_tier_id');
        });

        Schema::table('product_commission_categories', function (Blueprint $table): void {
            $table->dropUnique(['company_id', 'slug']);
            $table->dropConstrainedForeignId('company_id');
            $table->dropColumn(['slug', 'sort_order', 'is_active']);
        });

        Schema::dropIfExists('agent_tiers');
    }
};
