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
        Schema::table('affiliate_profiles', function (Blueprint $table) {

            $table->foreignId('photo_id')->nullable()->constrained('medias')->nullOnDelete();
            $table->foreignId('identity_card_id')->nullable()->constrained('medias')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('affiliate_profiles', function (Blueprint $table) {
            $table->dropForeign(['photo_id']);
            $table->dropForeign(['identity_card_id']);

            $table->dropColumn(['photo_id', 'identity_card_id']);
        });
    }
};
