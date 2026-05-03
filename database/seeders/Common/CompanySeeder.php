<?php

namespace Database\Seeders\Common;

use App\Enums\CompanyTeamStatus;
use App\Enums\CompanyType;
use App\Enums\VendorAgentPartnerStatus;
use App\Models\AgentSubscription;
use App\Models\AgentSubscriptionPackage;
use App\Models\Company;
use App\Models\Role;
use App\Models\Team;
use App\Models\User;
use App\Models\VendorAgentPartner;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CompanySeeder extends Seeder
{
  public function run(): void
  {
    // Mendifinisikan paket langganan (subscription package) yang akan dibuat
    $packages = [
      [
        'name' => 'Basic',
        'duration_months' => 12,
        'price' => 6000000,
        'is_active' => true,
      ],
    ];

    foreach ($packages as $package) {
      AgentSubscriptionPackage::factory()->create($package);
    }

    // Mendifinisikan perusahaan (company) yang akan dibuat
    $companies = [
      [
        'username' => 'vendor',
        'subdomain' => 'vendor',
        'company_type' => CompanyType::VENDOR,
      ],
      [
        'username' => 'john',
        'subdomain' => 'john',
        'company_type' => CompanyType::AGENT,
      ],
      [
        'username' => 'greatchinatour',
        'subdomain' => 'greatchinatour',
        'company_type' => CompanyType::VENDOR,
      ],
    ];

    foreach ($companies as $seed) {
      $user = User::where('username', $seed['username'])->first();
      if (!$user) {
        $this->command->error("User with username '{$seed['username']}' not found. Please run UserSeeder first.");
        continue;
      }

      $company = Company::factory()->create([
        'username' => $seed['username'],
        'type' => $seed['company_type'],
        'name' => ucfirst($seed['username']) . ' Company',
        'email' => $user->email,
        'address' => 'Jakarta',
        'phone' => '0123456789',
      ]);

      // Update: Menambahkan domain_enabled => true saat membuat domain perusahaan
      $company->domain()->create([
        'subdomain' => $seed['subdomain'],
        'domain_enabled' => true, // <-- Baris ini yang ditambahkan
      ]);

      $user->companies()->attach($company->id, [
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
      ]);

      $team = Team::where('name', "company:{$company->id}")->firstOrCreate();
      $superadmin = Role::where('name', "company:{$company->id}:superadmin")->firstOrCreate();
      $user->addRole($superadmin, $team);

      if ($company['type'] === CompanyType::AGENT) {
        AgentSubscription::create([
          'company_id' => $company->id,
          'package_id' => 1,
          'started_at' => now(),
          'ended_at' => now()->addDays(999),
        ]);
      }
    }

    $vendorCompany = Company::where('username', 'vendor')->first();
    $johnCompany = Company::where('username', 'john')->first();

    if ($vendorCompany && $johnCompany) {
      VendorAgentPartner::create([
        'vendor_id' => $vendorCompany->id,
        'agent_id' => $johnCompany->id,
        'status' => VendorAgentPartnerStatus::ACTIVE,
        'applied_at' => now(),
        'accepted_at' => now(),
      ]);
    }

    $jane = User::factory()->create([
      'company_id' => $johnCompany ? $johnCompany->id : 2,
      'name' => 'Jane',
      'email' => 'jane@travelboost.co.id',
      'username' => 'jane',
      'address' => 'Jakarta',
      'phone' => '0',
      'password' => Hash::make('jane'),
    ]);
  }
}
