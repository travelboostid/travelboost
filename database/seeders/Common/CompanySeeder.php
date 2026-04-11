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
        // Define the target packages to create
        $packages = [
            [
                'name' => 'Basic',
                'duration_months' => 1,
                'price' => 100000,
                'is_active' => true,
            ],
            [
                'name' => 'Pro',
                'duration_months' => 6,
                'price' => 500000,
                'is_active' => true,
            ],
            [
                'name' => 'Enterprise',
                'duration_months' => 12,
                'price' => 1000000,
                'is_active' => true,
            ],
        ];

        foreach ($packages as $package) {
            AgentSubscriptionPackage::factory()->create($package);
        }

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
        ];

        foreach ($companies as $company) {
            $user = User::where('username', $company['username'])->first();
            if (! $user) {
                $this->command->error("User with username '{$company['username']}' not found. Please run UserSeeder first.");

                continue;
            }
            $company = Company::factory()->create([
                'username' => $company['username'],
                'subdomain' => $company['subdomain'],
                'type' => $company['company_type'],
                'name' => ucfirst($company['username']).' Company',
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
