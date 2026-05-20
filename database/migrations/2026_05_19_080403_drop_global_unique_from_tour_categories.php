<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            ALTER TABLE tour_categories
            DROP CONSTRAINT IF EXISTS tour_categories_name_unique
        ");
    }

    public function down(): void
    {
        DB::statement("
            ALTER TABLE tour_categories
            ADD CONSTRAINT tour_categories_name_unique
            UNIQUE (name)
        ");
    }
};