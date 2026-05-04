<?php

namespace Database\Seeders\Development;

use Database\Seeders\Common\AffiliateCommissionRateSeeder;
use Database\Seeders\Common\AffiliateSeeder;
use Database\Seeders\Common\AppConfigSeeder;
use Database\Seeders\Common\CompanySeeder;
use Database\Seeders\Common\ContinentSeeder;
use Database\Seeders\Common\CountrySeeder;
use Database\Seeders\Common\CurrencySeeder;
use Database\Seeders\Common\PriceCategorySeeder;
use Database\Seeders\Common\RegionSeeder;
use Database\Seeders\Common\RolePermissionSeeder;
use Database\Seeders\Common\TourSeeder;
use Database\Seeders\Common\UserSeeder;
use Illuminate\Database\Seeder;

class DevelopmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->call([
            AppConfigSeeder::class,
            RolePermissionSeeder::class,
            UserSeeder::class,
            CompanySeeder::class,
            ContinentSeeder::class,
            RegionSeeder::class,
            CountrySeeder::class,
            TourSeeder::class,
            AffiliateCommissionRateSeeder::class,
            AffiliateSeeder::class,
            CurrencySeeder::class,
            PriceCategorySeeder::class,
        ]);
    }
}
