<?php

namespace Database\Seeders\Local;

use App\Enums\CompanyType;
use App\Enums\CompanyTeamStatus;
use App\Models\User;
use App\Models\Company;
use App\Models\Role;
use App\Models\Team;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CompanySeeder extends Seeder
{
  public function run(): void
  {
    $targets = [
      [
        'username' => 'root',
        'subdomain' => 'root',
        'company_type' => CompanyType::VENDOR,
      ],
      [
        'username' => 'john',
        'subdomain' => 'john',
        'company_type' => CompanyType::AGENT,
      ],
    ];

    foreach ($targets as $target) {
      $user = User::where('username', $target['username'])->first();
      if (!$user) {
        $this->command->error("User with username '{$target['username']}' not found. Please run UserSeeder first.");
        continue;
      }
      $company = Company::factory()->create([
        'username' => $target['username'],
        'subdomain' => $target['subdomain'],
        'type' => $target['company_type'],
        'name' => ucfirst($target['username']) . ' Company',
        'email' => $user->email,
        'address' => 'Jakarta',
        'phone' => '',
      ]);
      $user->companies()->attach($company->id, [
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
      ]);
      $team = Team::where('name', "company:{$company->id}")->first();
      $superadmin = Role::where('name', "company:{$company->id}:superadmin")->first();
      $user->addRole($superadmin, $team);
    }

    $jane = User::factory()->create([
      'company_id' => 2,
      'name' => 'Jane',
      'email' => 'jane@travelboost.co.id',
      'username' => 'jane',
      'address' => 'Jakarta',
      'phone' => '0',
      'password' => Hash::make('jane'),
    ]);
  }
}
