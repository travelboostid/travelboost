<?php

namespace Database\Seeders;

use Database\Seeders\Development\DevelopmentSeeder;
use Database\Seeders\Local\LocalSeeder;
use Database\Seeders\Production\ProductionSeeder;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
  public function run(): void
  {
    $this->call([
      \Laravolt\Indonesia\Seeds\ProvincesSeeder::class,
      \Laravolt\Indonesia\Seeds\CitiesSeeder::class,
      \Laravolt\Indonesia\Seeds\DistrictsSeeder::class,
      \Laravolt\Indonesia\Seeds\VillagesSeeder::class,
      \Database\Seeders\Common\ParameterTravelboostSeeder::class,
    ]);

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
  }
}
