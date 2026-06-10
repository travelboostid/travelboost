<?php

namespace Database\Seeders\Production;

use App\Models\AgentSubscription;
use App\Models\AgentSubscriptionPackage;
use App\Models\Company;
use Illuminate\Database\Seeder;

class ProductionAgentSubscriptionSeeder extends Seeder
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
                $package
            );
        }

        $johnCompany = Company::query()->where('username', 'john')->first();
        $basicPackage = AgentSubscriptionPackage::query()
            ->where('name', 'Basic Subscription')
            ->first();

        if (! $johnCompany || ! $basicPackage) {
            return;
        }

        AgentSubscription::query()->updateOrCreate(
            ['company_id' => $johnCompany->id],
            [
                'package_id' => $basicPackage->id,
                'started_at' => now(),
                'ended_at' => now()->addDays(999),
            ]
        );
    }
}
