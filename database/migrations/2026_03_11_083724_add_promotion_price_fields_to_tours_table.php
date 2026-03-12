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
        Schema::table('tours', function (Blueprint $table) {
            $table->decimal('promoprice', 15, 2)->default(0)->after('showprice');
            $table->string('promote_title')->nullable()->after('earlybird');
            $table->decimal('promote_price', 15, 2)->default(0)->after('promote_title');
            $table->string('promote_note')->nullable()->after('promote_price');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tours', function (Blueprint $table) {
            $table->dropColumn('promoprice');
            $table->dropColumn('promote_title');
            $table->dropColumn('promote_price');
            $table->dropColumn('promote_note');
        });
    }
};
