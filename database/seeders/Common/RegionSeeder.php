<?php

namespace Database\Seeders\Common;

use App\Models\Continent;
use App\Models\Region;
use Illuminate\Database\Seeder;

class RegionSeeder extends Seeder
{
    public function run(): void
    {
        $regions = [
            // Asia
            ['name' => 'East Asia', 'continent' => 'Asia'],
            ['name' => 'Southeast Asia', 'continent' => 'Asia'],
            ['name' => 'South Asia', 'continent' => 'Asia'],
            ['name' => 'Central Asia', 'continent' => 'Asia'],
            ['name' => 'Western Asia (Middle East)', 'continent' => 'Asia'],
            ['name' => 'North Asia (Siberia)', 'continent' => 'Asia'],

            // Australia / Oceania
            ['name' => 'Australian Capital Territory', 'continent' => 'Australia'],
            ['name' => 'New South Wales', 'continent' => 'Australia'],
            ['name' => 'Northern Territory', 'continent' => 'Australia'],
            ['name' => 'Queensland', 'continent' => 'Australia'],
            ['name' => 'South Australia', 'continent' => 'Australia'],
            ['name' => 'Tasmania', 'continent' => 'Australia'],
            ['name' => 'Victoria', 'continent' => 'Australia'],
            ['name' => 'Western Australia', 'continent' => 'Australia'],

            // Europe
            ['name' => 'Northern Europe', 'continent' => 'Europe'],
            ['name' => 'Southern Europe', 'continent' => 'Europe'],
            ['name' => 'Eastern Europe', 'continent' => 'Europe'],
            ['name' => 'Western Europe', 'continent' => 'Europe'],
            ['name' => 'Central Europe', 'continent' => 'Europe'],

            // Africa
            ['name' => 'Northern Africa', 'continent' => 'Africa'],
            ['name' => 'Central or Middle Africa', 'continent' => 'Africa'],
            ['name' => 'Southern Africa', 'continent' => 'Africa'],
            ['name' => 'East Africa', 'continent' => 'Africa'],
            ['name' => 'Western Africa', 'continent' => 'Africa'],

            // America
            ['name' => 'North America', 'continent' => 'America'],
            ['name' => 'Central America', 'continent' => 'America'],
            ['name' => 'Caribbean (West Indies)', 'continent' => 'America'],
            ['name' => 'South America', 'continent' => 'America'],
        ];

        foreach ($regions as $data) {
            $continentId = Continent::query()
                ->where('name', $data['continent'])
                ->value('id');

            if (! $continentId) {
                $this->command?->warn("Continent '{$data['continent']}' not found. Skipping region '{$data['name']}'.");

                continue;
            }

            Region::query()->updateOrCreate(
                [
                    'name' => $data['name'],
                    'continent_id' => $continentId,
                ],
                [
                    'name' => $data['name'],
                    'continent_id' => $continentId,
                ],
            );
        }
    }
}
