<?php

namespace Database\Seeders\Common;

use App\Enums\UserStatus;
use App\Models\Role;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
  public function run(): void
  {
    $root = User::create([
      'name' => 'Root',
      'email' => 'root@travelboost.co.id',
      'username' => 'root',
      'address' => 'Jakarta',
      'phone' => '',
      'company_id' => null,
      'status' => UserStatus::ACTIVE,
      'password' => Hash::make('root'),
    ]);

    $root->syncRoles(['user:admin', 'admin:superadmin']);

    $vendor = User::create([
      'name' => 'Vendor',
      'email' => 'vendor@travelboost.co.id',
      'username' => 'vendor',
      'address' => 'Jakarta',
      'phone' => '0',
      'status' => UserStatus::ACTIVE,
      'password' => Hash::make('vendor'),
    ]);
    $vendor->syncRoles(['user:vendor']);

    $greatChinaTourUser = User::create([
      'name' => 'Great China Tour',
      'email' => 'greatchinatour@travelboost.co.id',
      'username' => 'greatchinatour',
      'address' => 'Jakarta',
      'phone' => '0',
      'status' => UserStatus::ACTIVE,
      'password' => Hash::make('greatchinatour'),
    ]);
    $greatChinaTourUser->syncRoles(['user:customer']);

    $john = User::create([
      'name' => 'John',
      'email' => 'john@travelboost.co.id',
      'username' => 'john',
      'address' => 'Jakarta',
      'phone' => '',
      'status' => UserStatus::ACTIVE,
      'password' => Hash::make('john'),
    ]);
    $john->syncRoles(['user:agent']);
  }
}
