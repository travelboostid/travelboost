<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RegionSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        $regions = [
            // 🌏 ASIA (continent_id = 1)
            ['region' => 'East Asia', 'continent_id' => 1],
            ['region' => 'Southeast Asia', 'continent_id' => 1],
            ['region' => 'South Asia', 'continent_id' => 1],
            ['region' => 'Central Asia', 'continent_id' => 1],
            ['region' => 'Western Asia (Middle East)', 'continent_id' => 1],
            ['region' => 'North Asia (Siberia)', 'continent_id' => 1],

            // 🇦🇺 AUSTRALIA / OCEANIA (continent_id = 5)
            ['region' => 'Australian Capital Territory', 'continent_id' => 5],
            ['region' => 'New South Wales', 'continent_id' => 5],
            ['region' => 'Northern Territory', 'continent_id' => 5],
            ['region' => 'Queensland', 'continent_id' => 5],
            ['region' => 'South Australia', 'continent_id' => 5],
            ['region' => 'Tasmania', 'continent_id' => 5],
            ['region' => 'Victoria', 'continent_id' => 5],
            ['region' => 'Western Australia', 'continent_id' => 5],

            // 🇪🇺 EUROPE (continent_id = 2)
            ['region' => 'Northern Europe', 'continent_id' => 2],
            ['region' => 'Southern Europe', 'continent_id' => 2],
            ['region' => 'Eastern Europe', 'continent_id' => 2],
            ['region' => 'Western Europe', 'continent_id' => 2],
            ['region' => 'Central Europe', 'continent_id' => 2],

            // 🌍 AFRICA (continent_id = 3)
            ['region' => 'Northern Africa', 'continent_id' => 3],
            ['region' => 'Central or Middle Africa', 'continent_id' => 3],
            ['region' => 'Southern Africa', 'continent_id' => 3],
            ['region' => 'East Africa', 'continent_id' => 3],
            ['region' => 'Western Africa', 'continent_id' => 3],

            // 🌎 AMERICA (continent_id = 4)
            ['region' => 'North America', 'continent_id' => 4],
            ['region' => 'Central America', 'continent_id' => 4],
            ['region' => 'Caribbean (West Indies)', 'continent_id' => 4],
            ['region' => 'South America', 'continent_id' => 4],
        ];

        foreach ($regions as $data) {
            DB::table('regions')->updateOrInsert(
                ['region' => $data['region']], // unique key
                [
                    'continent_id' => $data['continent_id'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }
}