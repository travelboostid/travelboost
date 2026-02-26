<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CountrySeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        $countries = [

            // 🌏 Southeast Asia (continent_id = 1, region_id = 2)
            ['country' => 'Myanmar', 'continent_id' => 1, 'region_id' => 2],
            ['country' => 'Thailand', 'continent_id' => 1, 'region_id' => 2],
            ['country' => 'Laos', 'continent_id' => 1, 'region_id' => 2],
            ['country' => 'Cambodia', 'continent_id' => 1, 'region_id' => 2],
            ['country' => 'Vietnam', 'continent_id' => 1, 'region_id' => 2],
            ['country' => 'Malaysia', 'continent_id' => 1, 'region_id' => 2],
            ['country' => 'Indonesia', 'continent_id' => 1, 'region_id' => 2],
            ['country' => 'Philippines', 'continent_id' => 1, 'region_id' => 2],
            ['country' => 'Singapore', 'continent_id' => 1, 'region_id' => 2],
            ['country' => 'Brunei', 'continent_id' => 1, 'region_id' => 2],
            ['country' => 'Timor-Leste', 'continent_id' => 1, 'region_id' => 2],

            // 🌏 East Asia (continent_id = 1, region_id = 1)
            ['country' => 'China', 'continent_id' => 1, 'region_id' => 1],
            ['country' => 'Japan', 'continent_id' => 1, 'region_id' => 1],
            ['country' => 'Mongolia', 'continent_id' => 1, 'region_id' => 1],
            ['country' => 'North Korea', 'continent_id' => 1, 'region_id' => 1],
            ['country' => 'South Korea', 'continent_id' => 1, 'region_id' => 1],
            ['country' => 'Taiwan', 'continent_id' => 1, 'region_id' => 1],

            // 🌏 South Asia (continent_id = 1, region_id = 3)
            ['country' => 'Afghanistan', 'continent_id' => 1, 'region_id' => 3],
            ['country' => 'Bangladesh', 'continent_id' => 1, 'region_id' => 3],
            ['country' => 'Bhutan', 'continent_id' => 1, 'region_id' => 3],
            ['country' => 'India', 'continent_id' => 1, 'region_id' => 3],
            ['country' => 'Maldives', 'continent_id' => 1, 'region_id' => 3],
            ['country' => 'Nepal', 'continent_id' => 1, 'region_id' => 3],
            ['country' => 'Pakistan', 'continent_id' => 1, 'region_id' => 3],
            ['country' => 'Sri Lanka', 'continent_id' => 1, 'region_id' => 3],

            // 🌏 Central Asia (continent_id = 1, region_id = 4)
            ['country' => 'Kazakhstan', 'continent_id' => 1, 'region_id' => 4],
            ['country' => 'Kyrgyzstan', 'continent_id' => 1, 'region_id' => 4],
            ['country' => 'Tajikistan', 'continent_id' => 1, 'region_id' => 4],
            ['country' => 'Turkmenistan', 'continent_id' => 1, 'region_id' => 4],
            ['country' => 'Uzbekistan', 'continent_id' => 1, 'region_id' => 4],

            // 🌏 Western Asia / Middle East (continent_id = 1, region_id = 5)
            ['country' => 'Saudi Arabia', 'continent_id' => 1, 'region_id' => 5],
            ['country' => 'Iran', 'continent_id' => 1, 'region_id' => 5],
            ['country' => 'Turkey', 'continent_id' => 1, 'region_id' => 5],
            ['country' => 'Iraq', 'continent_id' => 1, 'region_id' => 5],
            ['country' => 'Israel', 'continent_id' => 1, 'region_id' => 5],
            ['country' => 'United Arab Emirates', 'continent_id' => 1, 'region_id' => 5],
            ['country' => 'Qatar', 'continent_id' => 1, 'region_id' => 5],

            // 🌏 North Asia / Siberia (continent_id = 1, region_id = 6)
            ['country' => 'Russia', 'continent_id' => 1, 'region_id' => 6],
            ['country' => 'Siberia', 'continent_id' => 1, 'region_id' => 6],

            // 🇦🇺 Australia (continent_id = 5, region_id = 7)
            ['country' => 'Australia', 'continent_id' => 5, 'region_id' => 7],
        ];

        foreach ($countries as $data) {
            DB::table('countries')->updateOrInsert(
                ['country' => $data['country']], // unique key
                [
                    'continent_id' => $data['continent_id'],
                    'region_id' => $data['region_id'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }
}