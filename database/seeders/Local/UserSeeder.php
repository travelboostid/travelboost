<?php

namespace Database\Seeders\Local;

use App\Enums\UserStatus;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
  public function run(): void
  {
    $superadmin = Role::where('name', 'company:0:superadmin')->first();
    $root = User::factory()->create([
      'name' => 'Root',
      'email' => 'root@travelboost.co.id',
      'username' => 'root',
      'address' => 'Jakarta',
      'phone' => '',
      'status' => UserStatus::ACTIVE,
      'password' => Hash::make('root'),
    ]);

    $root->addRole($superadmin);

    $john = User::factory()->create([
      'name' => 'John',
      'email' => 'john@travelboost.co.id',
      'username' => 'john',
      'address' => 'Jakarta',
      'phone' => '',
      'status' => UserStatus::ACTIVE,
      'password' => Hash::make('john'),
    ]);

    $john->addRole($superadmin);
  }
}
