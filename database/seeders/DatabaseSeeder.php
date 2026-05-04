<?php

namespace Database\Seeders;

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
    // 1. Seed data wilayah Indonesia dari Laravolt
    // Urutan wajib: Provinsi -> Kota -> Kecamatan -> Kelurahan/Desa
    $this->call([
      \Laravolt\Indonesia\Seeds\ProvincesSeeder::class,
      \Laravolt\Indonesia\Seeds\CitiesSeeder::class,
      \Laravolt\Indonesia\Seeds\DistrictsSeeder::class,
      \Laravolt\Indonesia\Seeds\VillagesSeeder::class,
    ]);

    // 2. Seed data spesifik environment milik team
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
