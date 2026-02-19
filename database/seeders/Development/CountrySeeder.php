<?php

namespace Database\Seeders\Development;

use App\Models\Country;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CountrySeeder extends Seeder
{
  public function run(): void
  {
    $countries = [

      // 🌏 Southeast Asia (continent_id = 1, region_id = 2)
      ['name' =>  'Myanmar', 'continent_id' => 1, 'region_id' => 2],
      ['name' =>  'Thailand', 'continent_id' => 1, 'region_id' => 2],
      ['name' =>  'Laos', 'continent_id' => 1, 'region_id' => 2],
      ['name' =>  'Cambodia', 'continent_id' => 1, 'region_id' => 2],
      ['name' =>  'Vietnam', 'continent_id' => 1, 'region_id' => 2],
      ['name' =>  'Malaysia', 'continent_id' => 1, 'region_id' => 2],
      ['name' =>  'Indonesia', 'continent_id' => 1, 'region_id' => 2],
      ['name' =>  'Philippines', 'continent_id' => 1, 'region_id' => 2],
      ['name' =>  'Singapore', 'continent_id' => 1, 'region_id' => 2],
      ['name' =>  'Brunei', 'continent_id' => 1, 'region_id' => 2],
      ['name' =>  'Timor-Leste', 'continent_id' => 1, 'region_id' => 2],

      // 🌏 East Asia (continent_id = 1, region_id = 1)
      ['name' =>  'China', 'continent_id' => 1, 'region_id' => 1],
      ['name' =>  'Japan', 'continent_id' => 1, 'region_id' => 1],
      ['name' =>  'Mongolia', 'continent_id' => 1, 'region_id' => 1],
      ['name' =>  'North Korea', 'continent_id' => 1, 'region_id' => 1],
      ['name' =>  'South Korea', 'continent_id' => 1, 'region_id' => 1],
      ['name' =>  'Taiwan', 'continent_id' => 1, 'region_id' => 1],

      // 🌏 South Asia (continent_id = 1, region_id = 3)
      ['name' =>  'Afghanistan', 'continent_id' => 1, 'region_id' => 3],
      ['name' =>  'Bangladesh', 'continent_id' => 1, 'region_id' => 3],
      ['name' =>  'Bhutan', 'continent_id' => 1, 'region_id' => 3],
      ['name' =>  'India', 'continent_id' => 1, 'region_id' => 3],
      ['name' =>  'Maldives', 'continent_id' => 1, 'region_id' => 3],
      ['name' =>  'Nepal', 'continent_id' => 1, 'region_id' => 3],
      ['name' =>  'Pakistan', 'continent_id' => 1, 'region_id' => 3],
      ['name' =>  'Sri Lanka', 'continent_id' => 1, 'region_id' => 3],

      // 🌏 Central Asia (continent_id = 1, region_id = 4)
      ['name' =>  'Kazakhstan', 'continent_id' => 1, 'region_id' => 4],
      ['name' =>  'Kyrgyzstan', 'continent_id' => 1, 'region_id' => 4],
      ['name' =>  'Tajikistan', 'continent_id' => 1, 'region_id' => 4],
      ['name' =>  'Turkmenistan', 'continent_id' => 1, 'region_id' => 4],
      ['name' =>  'Uzbekistan', 'continent_id' => 1, 'region_id' => 4],

      // 🌏 Western Asia / Middle East (continent_id = 1, region_id = 5)
      ['name' =>  'Saudi Arabia', 'continent_id' => 1, 'region_id' => 5],
      ['name' =>  'Iran', 'continent_id' => 1, 'region_id' => 5],
      ['name' =>  'Turkey', 'continent_id' => 1, 'region_id' => 5],
      ['name' =>  'Iraq', 'continent_id' => 1, 'region_id' => 5],
      ['name' =>  'Israel', 'continent_id' => 1, 'region_id' => 5],
      ['name' =>  'United Arab Emirates', 'continent_id' => 1, 'region_id' => 5],
      ['name' =>  'Qatar', 'continent_id' => 1, 'region_id' => 5],

      // 🌏 North Asia / Siberia (continent_id = 1, region_id = 6)
      ['name' =>  'Russia', 'continent_id' => 1, 'region_id' => 6],
      ['name' =>  'Siberia', 'continent_id' => 1, 'region_id' => 6],

      // 🇦🇺 Australia (continent_id = 5, region_id = 7)
      ['name' =>  'Australia', 'continent_id' => 5, 'region_id' => 7],
    ];

    foreach ($countries as $data) {
      Country::factory()->create([
        'name' => $data['name'],
        'continent_id' => $data['continent_id'],
        'region_id' => $data['region_id'],
      ]);
    }
  }
}
