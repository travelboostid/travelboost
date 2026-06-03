<?php

namespace Database\Seeders\Production;

use App\Enums\CompanyTeamStatus;
use App\Enums\CompanyType;
use App\Enums\UserStatus;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Role;
use App\Models\User;
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
                'password' => env('GRAND_CHINA_TRAVEL_PASSWORD', 'grandchinatravel'),
            ],
            [
                'name' => 'Islamic China Travel',
                'username' => 'islamicchinatravel',
                'email' => 'islamicchinatravel@travelboost.co.id',
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
                    'phone' => '',
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
                    'phone' => '',
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
    }
}
