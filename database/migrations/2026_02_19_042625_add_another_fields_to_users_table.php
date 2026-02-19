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
        Schema::table('users', function (Blueprint $table) {
            $table->string('active')->default('0')->after('type');
            $table->timestamp('actived_date')->nullable()->after('active');
            $table->foreignId('logo_image')
              ->nullable()
              ->constrained('medias')
              ->nullOnDelete();
            $table->string('catalog_link')
              ->default('')
              ->after('logo_image');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['logo_image']);
            $table->dropColumn([
                'active',
                'actived_date',
                'logo_image',
                'catalog_link',
            ]);
        });
    }
};
