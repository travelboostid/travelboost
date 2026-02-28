<?php

namespace Database\Seeders\Development;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DevelopmentSeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    $root = User::factory()->create([
      'name' => 'Root',
      'email' => 'root@travelboost.co.id',
      'username' => 'root',
      'address' => "Jakarta",
      'phone' => '0',
      'password' => Hash::make('root'),
    ]);
    $root->assignRole('superadmin');
    $john = User::factory()->create([
      'name' => 'John',
      'email' => 'john@travelboost.co.id',
      'username' => 'john',
      'address' => "Jakarta",
      'phone' => '0',
      'password' => Hash::make('john'),
    ]);
    $john->assignRole('admin');
  }
}
