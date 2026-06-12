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
        Schema::table('booking_passengers', function (Blueprint $table) {
            $table->foreignId('visa_category_item_id')
                ->nullable()
                ->after('visa_file_path')
                ->constrained('visa_category_items')
                ->nullOnDelete();
            $table->string('visa_type_description')->nullable()->after('visa_category_item_id');
            $table->decimal('visa_type_price', 15, 2)->default(0)->after('visa_type_description');
            $table->boolean('visa_type_is_taxable')->default(false)->after('visa_type_price');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('booking_passengers', function (Blueprint $table) {
            $table->dropConstrainedForeignId('visa_category_item_id');
            $table->dropColumn([
                'visa_type_description',
                'visa_type_price',
                'visa_type_is_taxable',
            ]);
        });
    }
};
