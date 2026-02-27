<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeederAdded extends Seeder
{
  public function run(): void
  {
    $synergy = User::updateOrCreate(
            ['email' => 'synergy@travelboost.co.id'],
            [
                'name' => 'Synergy',
                'username' => 'synergy',
                'type' => 'agent',
                'address' => 'Jakarta',
                'phone' => '0',
                'password' => Hash::make('123456'),
            ]
        );
        $synergy->assignRole('admin', 'agent');

        $synergy = User::updateOrCreate(
            ['email' => 'test@travelboost.co.id'],
            [
                'name' => 'Test',
                'username' => 'test',
                'type' => 'agent',
                'address' => 'Jakarta',
                'phone' => '0',
                'password' => Hash::make('123456'),
            ]
        );
        $synergy->assignRole('admin', 'agent');

        $root = User::updateOrCreate(
            ['email' => 'root2@travelboost.co.id'],
            [
                'name' => 'Root2',
                'username' => 'root2',
                'type' => 'vendor',
                'address' => "Jakarta",
                'phone' => '0',
                'password' => Hash::make('root2'),
            ]
        );
        $root->assignRole('superadmin', 'vendor');
  }
}
