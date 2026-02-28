<?php

namespace Database\Seeders;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;

use Database\Seeders\Development\DevelopmentSeeder;
use Database\Seeders\Local\LocalSeeder;
use Database\Seeders\Production\ProductionSeeder;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
  /**
   * Seed the application's database.
   */
  public function run(): void
  {
    switch (app()->environment()) {
      case 'local':
        $this->call(LocalSeeder::class);
        break;
      case 'development':
      case 'dev':
        $this->call(DevelopmentSeeder::class);
        break;
      case 'production':
      case 'prod':
        $this->call(ProductionSeeder::class);
        break;
      default:
        $this->call(DevelopmentSeeder::class);
        break;
    }
    // $this->call([
    //   RolePermissionSeeder::class,
    //   UserSeeder::class,
    //   TourSeeder::class,
    //   ChatSeeder::class,
    // ]);
  }
}
