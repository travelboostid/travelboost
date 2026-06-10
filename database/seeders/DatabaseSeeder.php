<?php

namespace Database\Seeders;

use Database\Seeders\Development\DevelopmentSeeder;
use Database\Seeders\Local\LocalSeeder;
use Database\Seeders\Production\ProductionSeeder;
use Illuminate\Database\Seeder;
use Laravolt\Indonesia\Seeds\CitiesSeeder;
use Laravolt\Indonesia\Seeds\DistrictsSeeder;
use Laravolt\Indonesia\Seeds\ProvincesSeeder;
use Laravolt\Indonesia\Seeds\VillagesSeeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            ProvincesSeeder::class,
            CitiesSeeder::class,
            DistrictsSeeder::class,
            VillagesSeeder::class,
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
