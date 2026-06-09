<?php

namespace Database\Seeders\Production;

use App\Enums\CompanyTeamStatus;
use App\Enums\CompanyType;
use App\Enums\UserStatus;
use App\Enums\VendorAgentPartnerStatus;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Role;
use App\Models\User;
use App\Models\VendorAgentPartner;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ProductionCompanySeeder extends Seeder
{
    public function run(): void
    {
        $vendors = [
            [
                'name' => 'Grand China Travel',
                'username' => 'grandchinatravel',
                'email' => 'grandchinatravel@travelboost.co.id',
                'phone' => '6281230001001',
                'password' => env('GRAND_CHINA_TRAVEL_PASSWORD', 'grandchinatravel'),
            ],
            [
                'name' => 'Islamic China Travel',
                'username' => 'islamicchinatravel',
                'email' => 'islamicchinatravel@travelboost.co.id',
                'phone' => '6281230001002',
                'password' => env('ISLAMIC_CHINA_TRAVEL_PASSWORD', 'islamicchinatravel'),
            ],
        ];

        foreach ($vendors as $vendor) {
            $user = User::query()->firstOrCreate(
                ['username' => $vendor['username']],
                [
                    'name' => $vendor['name'],
                    'email' => $vendor['email'],
                    'address' => 'Jakarta',
                    'phone' => $vendor['phone'],
                    'status' => UserStatus::ACTIVE,
                    'password' => Hash::make($vendor['password']),
                ]
            );

            $user->addRole('user:vendor');

            $company = Company::query()->firstOrCreate(
                ['username' => $vendor['username']],
                [
                    'type' => CompanyType::VENDOR,
                    'name' => $vendor['name'],
                    'email' => $vendor['email'],
                    'address' => 'Jakarta',
                    'phone' => $vendor['phone'],
                    'customer_service_phone' => $vendor['phone'],
                ]
            );

            $company->domain()->updateOrCreate(
                [],
                [
                    'subdomain' => $vendor['username'],
                    'domain_enabled' => true,
                    'subdomain_enabled' => true,
                ]
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
                ]
            );

            $superadmin = Role::query()
                ->where('name', "company:{$company->id}:superadmin")
                ->firstOrFail();

            $user->addRole($superadmin);
        }

        $john = User::query()->where('username', 'john')->first();

        if ($john) {
            $company = Company::query()->firstOrCreate(
                ['username' => 'john'],
                [
                    'type' => CompanyType::AGENT,
                    'name' => 'John Company',
                    'email' => $john->email,
                    'address' => 'Jakarta',
                    'phone' => '0123456789',
                    'customer_service_phone' => '0123456789',
                ]
            );

            $company->domain()->updateOrCreate(
                [],
                [
                    'subdomain' => 'john',
                    'domain_enabled' => true,
                    'subdomain_enabled' => true,
                ]
            );

            CompanyTeam::query()->updateOrCreate(
                [
                    'company_id' => $company->id,
                    'user_id' => $john->id,
                ],
                [
                    'status' => CompanyTeamStatus::ACTIVE,
                    'is_owner' => true,
                    'accepted_at' => now(),
                ]
            );

            $superadmin = Role::query()
                ->where('name', "company:{$company->id}:superadmin")
                ->firstOrFail();

            $john->addRole($superadmin);

            Company::query()
                ->whereIn('username', ['grandchinatravel', 'islamicchinatravel'])
                ->each(function (Company $vendor) use ($company): void {
                    VendorAgentPartner::query()->updateOrCreate(
                        [
                            'vendor_id' => $vendor->id,
                            'agent_id' => $company->id,
                        ],
                        [
                            'status' => VendorAgentPartnerStatus::ACTIVE,
                            'applied_at' => now(),
                            'accepted_at' => now(),
                            'show_vendor_name' => true,
                            'manual_payment_enabled' => true,
                            'online_payment_enabled' => true,
                        ]
                    );
                });
        }
    }
}
