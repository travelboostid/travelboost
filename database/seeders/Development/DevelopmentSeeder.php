<?php

namespace Database\Seeders\Development;

use Illuminate\Database\Seeder;

class DevelopmentSeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    $this->call([
      RolePermissionSeeder::class,
      UserSeeder::class,
      CompanySeeder::class,
      TourSeeder::class,
    ]);
  }
}
