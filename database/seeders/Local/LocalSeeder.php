<?php

namespace Database\Seeders\Local;

use Database\Seeders\Common\AppConfigSeeder;
use Database\Seeders\Common\ContinentSeeder;
use Database\Seeders\Common\CountrySeeder;
use Database\Seeders\Common\CurrencySeeder;
use Database\Seeders\Common\PaymentMethodSeeder;
use Database\Seeders\Common\PriceCategorySeeder;
use Database\Seeders\Common\RegionSeeder;
use Database\Seeders\Common\RolePermissionSeeder;
use Database\Seeders\Production\GrandChinaTravelTourSeeder;
use Database\Seeders\Production\IslamicChinaTravelTourSeeder;
use Database\Seeders\Production\ProductionAffiliateSeeder;
use Database\Seeders\Production\ProductionAgentSubscriptionSeeder;
use Database\Seeders\Production\ProductionCompanySeeder;
use Database\Seeders\Production\ProductionUserSeeder;
use Illuminate\Database\Seeder;

class LocalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->call([
            AppConfigSeeder::class,
            PaymentMethodSeeder::class,
            RolePermissionSeeder::class,
            ProductionUserSeeder::class,
            ProductionCompanySeeder::class,
            ProductionAgentSubscriptionSeeder::class,
            ProductionAffiliateSeeder::class,
            ContinentSeeder::class,
            RegionSeeder::class,
            CountrySeeder::class,
            CurrencySeeder::class,
            PriceCategorySeeder::class,
            GrandChinaTravelTourSeeder::class,
            IslamicChinaTravelTourSeeder::class,
        ]);
    }
}
