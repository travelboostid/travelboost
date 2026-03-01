<?php

namespace Database\Seeders\Local;

use App\Enums\CompanyType;
use App\Enums\CompanyMemberRole;
use App\Enums\CompanyUserStatus;
use App\Models\User;
use App\Models\Company;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CompanySeeder extends Seeder
{
  public function run(): void
  {
    // ===== Get existing Root user =====
    $root = User::where('username', 'root')->first();
    $john = User::where('username', 'john')->first();

    if ($root) {
      // ===== Create Company for Root =====
      $rootCompany = Company::factory()->create([
        'username' => 'root',
        'type' => CompanyType::VENDOR,
        'name' => 'Root',
        'email' => $root->email,
        'address' => 'Jakarta',
        'phone' => '0',
      ]);

      // ===== Attach user to company pivot =====
      $root->companies()->attach($rootCompany->id, [
        'role' => CompanyMemberRole::SUPERADMIN,
        'status' => CompanyUserStatus::ACTIVE,
      ]);
    }
    if ($john) {
      // ===== Create Company for John =====
      $johnCompany = Company::factory()->create([
        'username' => 'john',
        'type' => CompanyType::AGENT,
        'name' => 'John Travel',
        'email' => $john->email,
        'address' => 'Bandung',
        'phone' => '0',
      ]);

      // ===== Attach user to company pivot =====
      $john->companies()->attach($johnCompany->id, [
        'role' => CompanyMemberRole::SUPERADMIN,
        'status' => CompanyUserStatus::ACTIVE,
      ]);

      $jane = User::factory()->create([
        'company_id' => $johnCompany->id,
        'name' => 'Jane',
        'email' => 'jane@travelboost.co.id',
        'username' => 'jane',
        'address' => 'Jakarta',
        'phone' => '0',
        'password' => Hash::make('jane'),
      ]);
    }
  }
}
