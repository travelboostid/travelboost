<?php

namespace Database\Seeders\Production;

use Database\Seeders\Common\AppConfigSeeder;
use Database\Seeders\Common\ContinentSeeder;
use Database\Seeders\Common\CountrySeeder;
use Database\Seeders\Common\CurrencySeeder;
use Database\Seeders\Common\PaymentMethodSeeder;
use Database\Seeders\Common\PriceCategorySeeder;
use Database\Seeders\Common\RegionSeeder;
use Database\Seeders\Common\RolePermissionSeeder;
use Database\Seeders\Common\VisaCategorySeeder;
use Illuminate\Database\Seeder;

class ProductionSeeder extends Seeder
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
            ProductionVendorSettingsSeeder::class,
            ProductionAgentSubscriptionSeeder::class,
            ProductionAffiliateSeeder::class,
            ContinentSeeder::class,
            RegionSeeder::class,
            CountrySeeder::class,
            CurrencySeeder::class,
            PriceCategorySeeder::class,
            VisaCategorySeeder::class,
            GrandChinaTravelTourSeeder::class,
            IslamicChinaTravelTourSeeder::class,
        ]);
    }
}
