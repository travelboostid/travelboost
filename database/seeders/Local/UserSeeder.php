<?php

namespace Database\Seeders\Local;

use App\Enums\AgentUserRole;
use App\Enums\AgentUserStatus;
use App\Enums\VendorUserRole;
use App\Enums\VendorUserStatus;
use App\Models\Agent;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
  public function run(): void
  {
    $root = User::factory()->create([
      'name' => 'Root',
      'email' => 'root@travelboost.co.id',
      'username' => 'root',
      'address' => 'Jakarta',
      'phone' => '0',
      'password' => Hash::make('root'),
    ]);

    $root->assignRole('superadmin');

    $john = User::factory()->create([
      'name' => 'John',
      'email' => 'john@travelboost.co.id',
      'username' => 'john',
      'address' => 'Jakarta',
      'phone' => '0',
      'password' => Hash::make('john'),
    ]);

    $john->assignRole('admin');
  }
}
