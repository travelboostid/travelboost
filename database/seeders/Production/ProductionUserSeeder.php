<?php

namespace Database\Seeders\Production;

use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ProductionUserSeeder extends Seeder
{
    public function run(): void
    {
        $root = User::query()->updateOrCreate(
            ['username' => 'root'],
            [
                'name' => 'Root',
                'email' => 'root@travelboost.co.id',
                'address' => 'Jakarta',
                'phone' => '',
                'company_id' => null,
                'status' => UserStatus::ACTIVE,
                'password' => Hash::make(env('ROOT_PASSWORD', 'root')),
                'email_verified_at' => now(),
            ]
        );

        $root->syncRoles(['user:admin', 'admin:superadmin']);

        $john = User::query()->updateOrCreate(
            ['username' => 'john'],
            [
                'name' => 'John',
                'email' => 'john@travelboost.co.id',
                'address' => 'Jakarta',
                'phone' => '',
                'status' => UserStatus::ACTIVE,
                'password' => Hash::make(env('JOHN_AGENT_PASSWORD', 'john')),
                'email_verified_at' => now(),
            ]
        );

        $john->syncRoles(['user:agent']);
    }
}
