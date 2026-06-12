<?php

namespace Database\Seeders\Common;

use App\Models\Continent;
use Illuminate\Database\Seeder;

class ContinentSeeder extends Seeder
{
    public function run(): void
    {
        $continents = [
            'Asia',
            'Europe',
            'Africa',
            'America',
            'Australia',
        ];

        foreach ($continents as $name) {
            Continent::query()->updateOrCreate(
                ['name' => $name],
                ['name' => $name],
            );
        }
    }
}
