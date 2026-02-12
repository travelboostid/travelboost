<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
  public function run(): void
  {
    $root = User::factory()->create([
      'name' => 'Root',
      'email' => 'root@travelboost.co.id',
      'username' => 'root',
      'type' => 'vendor',
      'address' => "Jakarta",
      'phone' => '0',
      'password' => Hash::make('root'),
    ]);
    $root->assignRole('admin');
    $john = User::factory()->create([
      'name' => 'John',
      'email' => 'john@travelboost.co.id',
      'username' => 'john',
      'type' => 'agent',
      'address' => "Jakarta",
      'phone' => '0',
      'password' => Hash::make('john'),
    ]);
    $john->assignRole('admin');
  }
}
