<?php

namespace Database\Seeders\Local;

use Database\Seeders\Common\AiModelSeeder;
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
    ]);
  }
}
