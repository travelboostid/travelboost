<?php

use Database\Seeders\Common\RolePermissionSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Artisan;

return new class extends Migration
{
    public function up(): void
    {
        Artisan::call('db:seed', [
            '--class' => RolePermissionSeeder::class,
            '--force' => true,
        ]);
    }

    public function down(): void
    {
        //
    }
};
