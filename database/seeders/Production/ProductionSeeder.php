<?php

namespace Database\Seeders\Production;

use Database\Seeders\Common\AppConfigSeeder;
use Database\Seeders\Common\CompanySeeder;
use Database\Seeders\Common\ContinentSeeder;
use Database\Seeders\Common\CountrySeeder;
use Database\Seeders\Common\RegionSeeder;
use Database\Seeders\Common\RolePermissionSeeder;
use Database\Seeders\Common\TourSeeder;
use Database\Seeders\Common\UserSeeder;
use Database\Seeders\Common\CurrencySeeder;
use Database\Seeders\Common\PriceCategorySeeder;
use Illuminate\Database\Seeder;
use Database\Seeders\Common\ParameterTravelboostSeeder;
use Database\Seeders\Common\ParameterVendorSeeder;

class ProductionSeeder extends Seeder
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
      CurrencySeeder::class,
      PriceCategorySeeder::class,
      ParameterTravelboostSeeder::class,
      ParameterVendorSeeder::class,
    ]);
  }
}
