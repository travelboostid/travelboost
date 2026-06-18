<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('companies')
            ->select('id')
            ->orderBy('id')
            ->lazy()
            ->each(function (object $company): void {
                DB::table('promotion_budgets')->insertOrIgnore([
                    'company_id' => $company->id,
                    'balance' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            });
    }

    public function down(): void
    {
        // No-op: budget rows may already hold balances.
    }
};
