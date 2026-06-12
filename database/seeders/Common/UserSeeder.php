<?php

namespace Database\Seeders\Common;

use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
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
                'password' => Hash::make('root'),
            ],
        );

        $root->syncRoles(['user:admin', 'admin:superadmin']);

        $vendor = User::query()->updateOrCreate(
            ['username' => 'vendor'],
            [
                'name' => 'Vendor',
                'email' => 'vendor@travelboost.co.id',
                'address' => 'Jakarta',
                'phone' => '0',
                'status' => UserStatus::ACTIVE,
                'password' => Hash::make('vendor'),
            ],
        );
        $vendor->syncRoles(['user:vendor']);

        $greatChinaTourUser = User::query()->updateOrCreate(
            ['username' => 'greatchinatour'],
            [
                'name' => 'Great China Tour',
                'email' => 'greatchinatour@travelboost.co.id',
                'address' => 'Jakarta',
                'phone' => '0',
                'status' => UserStatus::ACTIVE,
                'password' => Hash::make('greatchinatour'),
            ],
        );
        $greatChinaTourUser->syncRoles(['user:vendor']);

        $john = User::query()->updateOrCreate(
            ['username' => 'john'],
            [
                'name' => 'John',
                'email' => 'john@travelboost.co.id',
                'address' => 'Jakarta',
                'phone' => '',
                'status' => UserStatus::ACTIVE,
                'password' => Hash::make('john'),
            ],
        );
        $john->syncRoles(['user:agent']);
    }
}
