<?php

namespace Database\Seeders\Common;

use App\Enums\CompanyTeamStatus;
use App\Enums\CompanyType;
use App\Enums\UserStatus;
use App\Enums\VendorAgentPartnerStatus;
use App\Models\AgentSubscription;
use App\Models\AgentSubscriptionPackage;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Role;
use App\Models\User;
use App\Models\VendorAgentPartner;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CompanySeeder extends Seeder
{
    public function run(): void
    {
        $packages = [
            [
                'name' => 'Free Trial 1 Month',
                'duration_months' => 1,
                'price' => 0,
                'is_active' => true,
            ],
            [
                'name' => 'Basic Subscription',
                'duration_months' => 12,
                'price' => 6000000,
                'is_active' => true,
            ],
        ];

        foreach ($packages as $package) {
            AgentSubscriptionPackage::query()->updateOrCreate(
                ['name' => $package['name']],
                $package,
            );
        }

        $basicPackage = AgentSubscriptionPackage::query()
            ->where('name', 'Basic Subscription')
            ->first();

        $companies = [
            [
                'username' => 'vendor',
                'subdomain' => 'vendor',
                'company_type' => CompanyType::VENDOR,
                'deposit' => 100000000,
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
            $user = User::query()->where('username', $seed['username'])->first();
            if (! $user) {
                $this->command?->error("User with username '{$seed['username']}' not found. Please run UserSeeder first.");

                continue;
            }

            $company = Company::query()->updateOrCreate(
                ['username' => $seed['username']],
                [
                    'type' => $seed['company_type'],
                    'name' => ucfirst($seed['username']).' Company',
                    'email' => $user->email,
                    'address' => 'Jakarta',
                    'phone' => '0123456789',
                ],
            );

            if (isset($seed['deposit']) && $seed['deposit'] > 0) {
                $wallet = $company->wallet;
                $hasSeedDeposit = $wallet
                    ->transactions()
                    ->where('meta->type', 'seed-balance')
                    ->exists();

                if (! $hasSeedDeposit) {
                    $wallet->deposit($seed['deposit'], [
                        'type' => 'seed-balance',
                        'description' => 'Initial seeded wallet balance',
                    ]);
                }
            }

            $company->domain()->updateOrCreate(
                [],
                [
                    'subdomain' => $seed['subdomain'],
                    'domain_enabled' => true,
                    'subdomain_enabled' => true,
                ],
            );

            CompanyTeam::query()->updateOrCreate(
                [
                    'company_id' => $company->id,
                    'user_id' => $user->id,
                ],
                [
                    'status' => CompanyTeamStatus::ACTIVE,
                    'is_owner' => true,
                    'accepted_at' => now(),
                ],
            );

            $superadmin = Role::query()
                ->where('name', "company:{$company->id}:superadmin")
                ->firstOrCreate();

            $user->addRole($superadmin);

            if ($company->type === CompanyType::AGENT && $basicPackage) {
                AgentSubscription::query()->updateOrCreate(
                    ['company_id' => $company->id],
                    [
                        'package_id' => $basicPackage->id,
                        'started_at' => now(),
                        'ended_at' => now()->addDays(999),
                    ],
                );
            }
        }

        $vendorCompany = Company::query()->where('username', 'vendor')->first();
        $johnCompany = Company::query()->where('username', 'john')->first();

        if ($vendorCompany && $johnCompany) {
            VendorAgentPartner::query()->updateOrCreate(
                [
                    'vendor_id' => $vendorCompany->id,
                    'agent_id' => $johnCompany->id,
                ],
                [
                    'status' => VendorAgentPartnerStatus::ACTIVE,
                    'applied_at' => now(),
                    'accepted_at' => now(),
                ],
            );
        }

        $jane = User::query()->updateOrCreate(
            ['username' => 'jane'],
            [
                'company_id' => $johnCompany?->id,
                'name' => 'Jane',
                'email' => 'jane@travelboost.co.id',
                'address' => 'Jakarta',
                'phone' => '0',
                'status' => UserStatus::ACTIVE,
                'password' => Hash::make('jane'),
            ],
        );
        $jane->syncRoles(['user:customer']);
    }
}
