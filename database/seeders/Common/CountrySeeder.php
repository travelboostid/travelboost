<?php

namespace Database\Seeders\Common;

use App\Models\Continent;
use App\Models\Country;
use App\Models\Region;
use Illuminate\Database\Seeder;

class CountrySeeder extends Seeder
{
    public function run(): void
    {
        $countries = [
            // Southeast Asia
            ['name' => 'Myanmar', 'continent' => 'Asia', 'region' => 'Southeast Asia'],
            ['name' => 'Thailand', 'continent' => 'Asia', 'region' => 'Southeast Asia'],
            ['name' => 'Laos', 'continent' => 'Asia', 'region' => 'Southeast Asia'],
            ['name' => 'Cambodia', 'continent' => 'Asia', 'region' => 'Southeast Asia'],
            ['name' => 'Vietnam', 'continent' => 'Asia', 'region' => 'Southeast Asia'],
            ['name' => 'Malaysia', 'continent' => 'Asia', 'region' => 'Southeast Asia'],
            ['name' => 'Indonesia', 'continent' => 'Asia', 'region' => 'Southeast Asia'],
            ['name' => 'Philippines', 'continent' => 'Asia', 'region' => 'Southeast Asia'],
            ['name' => 'Singapore', 'continent' => 'Asia', 'region' => 'Southeast Asia'],
            ['name' => 'Brunei', 'continent' => 'Asia', 'region' => 'Southeast Asia'],
            ['name' => 'Timor-Leste', 'continent' => 'Asia', 'region' => 'Southeast Asia'],

            // East Asia
            ['name' => 'China', 'continent' => 'Asia', 'region' => 'East Asia'],
            ['name' => 'Japan', 'continent' => 'Asia', 'region' => 'East Asia'],
            ['name' => 'Mongolia', 'continent' => 'Asia', 'region' => 'East Asia'],
            ['name' => 'North Korea', 'continent' => 'Asia', 'region' => 'East Asia'],
            ['name' => 'South Korea', 'continent' => 'Asia', 'region' => 'East Asia'],
            ['name' => 'Taiwan', 'continent' => 'Asia', 'region' => 'East Asia'],

            // South Asia
            ['name' => 'Afghanistan', 'continent' => 'Asia', 'region' => 'South Asia'],
            ['name' => 'Bangladesh', 'continent' => 'Asia', 'region' => 'South Asia'],
            ['name' => 'Bhutan', 'continent' => 'Asia', 'region' => 'South Asia'],
            ['name' => 'India', 'continent' => 'Asia', 'region' => 'South Asia'],
            ['name' => 'Maldives', 'continent' => 'Asia', 'region' => 'South Asia'],
            ['name' => 'Nepal', 'continent' => 'Asia', 'region' => 'South Asia'],
            ['name' => 'Pakistan', 'continent' => 'Asia', 'region' => 'South Asia'],
            ['name' => 'Sri Lanka', 'continent' => 'Asia', 'region' => 'South Asia'],

            // Central Asia
            ['name' => 'Kazakhstan', 'continent' => 'Asia', 'region' => 'Central Asia'],
            ['name' => 'Kyrgyzstan', 'continent' => 'Asia', 'region' => 'Central Asia'],
            ['name' => 'Tajikistan', 'continent' => 'Asia', 'region' => 'Central Asia'],
            ['name' => 'Turkmenistan', 'continent' => 'Asia', 'region' => 'Central Asia'],
            ['name' => 'Uzbekistan', 'continent' => 'Asia', 'region' => 'Central Asia'],

            // Western Asia / Middle East
            ['name' => 'Saudi Arabia', 'continent' => 'Asia', 'region' => 'Western Asia (Middle East)'],
            ['name' => 'Iran', 'continent' => 'Asia', 'region' => 'Western Asia (Middle East)'],
            ['name' => 'Turkey', 'continent' => 'Asia', 'region' => 'Western Asia (Middle East)'],
            ['name' => 'Iraq', 'continent' => 'Asia', 'region' => 'Western Asia (Middle East)'],
            ['name' => 'Israel', 'continent' => 'Asia', 'region' => 'Western Asia (Middle East)'],
            ['name' => 'United Arab Emirates', 'continent' => 'Asia', 'region' => 'Western Asia (Middle East)'],
            ['name' => 'Qatar', 'continent' => 'Asia', 'region' => 'Western Asia (Middle East)'],

            // North Asia / Siberia
            ['name' => 'Russia', 'continent' => 'Asia', 'region' => 'North Asia (Siberia)'],
            ['name' => 'Siberia', 'continent' => 'Asia', 'region' => 'North Asia (Siberia)'],

            // Australia
            ['name' => 'Australia', 'continent' => 'Australia', 'region' => 'Australian Capital Territory'],
        ];

        foreach ($countries as $data) {
            $continentId = Continent::query()
                ->where('name', $data['continent'])
                ->value('id');

            $regionId = Region::query()
                ->where('name', $data['region'])
                ->when($continentId, fn ($query) => $query->where('continent_id', $continentId))
                ->value('id');

            if (! $continentId || ! $regionId) {
                $this->command?->warn("Skipping country '{$data['name']}' because continent or region was not found.");

                continue;
            }

            Country::query()->updateOrCreate(
                ['name' => $data['name']],
                [
                    'continent_id' => $continentId,
                    'region_id' => $regionId,
                ],
            );
        }
    }
}
