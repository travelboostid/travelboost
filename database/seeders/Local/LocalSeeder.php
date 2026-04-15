<?php

namespace Database\Seeders\Local;

use Database\Seeders\Common\AiModelSeeder;
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

class LocalSeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    $this->call([
      AiModelSeeder::class,
      RolePermissionSeeder::class,
      UserSeeder::class,
      CompanySeeder::class,
      ContinentSeeder::class,
      RegionSeeder::class,
      CountrySeeder::class,
      TourSeeder::class,
      CurrencySeeder::class,
      PriceCategorySeeder::class,
    ]);
  }
}
