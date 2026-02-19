<?php

namespace Database\Seeders\Development;

use App\Models\Region;
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
      ['name' => 'East Asia', 'continent_id' => 1],
      ['name' => 'Southeast Asia', 'continent_id' => 1],
      ['name' => 'South Asia', 'continent_id' => 1],
      ['name' => 'Central Asia', 'continent_id' => 1],
      ['name' => 'Western Asia (Middle East)', 'continent_id' => 1],
      ['name' => 'North Asia (Siberia)', 'continent_id' => 1],

      // 🇦🇺 AUSTRALIA / OCEANIA (continent_id = 5)
      ['name' => 'Australian Capital Territory', 'continent_id' => 5],
      ['name' => 'New South Wales', 'continent_id' => 5],
      ['name' => 'Northern Territory', 'continent_id' => 5],
      ['name' => 'Queensland', 'continent_id' => 5],
      ['name' => 'South Australia', 'continent_id' => 5],
      ['name' => 'Tasmania', 'continent_id' => 5],
      ['name' => 'Victoria', 'continent_id' => 5],
      ['name' => 'Western Australia', 'continent_id' => 5],

      // 🇪🇺 EUROPE (continent_id = 2)
      ['name' => 'Northern Europe', 'continent_id' => 2],
      ['name' => 'Southern Europe', 'continent_id' => 2],
      ['name' => 'Eastern Europe', 'continent_id' => 2],
      ['name' => 'Western Europe', 'continent_id' => 2],
      ['name' => 'Central Europe', 'continent_id' => 2],

      // 🌍 AFRICA (continent_id = 3)
      ['name' => 'Northern Africa', 'continent_id' => 3],
      ['name' => 'Central or Middle Africa', 'continent_id' => 3],
      ['name' => 'Southern Africa', 'continent_id' => 3],
      ['name' => 'East Africa', 'continent_id' => 3],
      ['name' => 'Western Africa', 'continent_id' => 3],

      // 🌎 AMERICA (continent_id = 4)
      ['name' => 'North America', 'continent_id' => 4],
      ['name' => 'Central America', 'continent_id' => 4],
      ['name' => 'Caribbean (West Indies)', 'continent_id' => 4],
      ['name' => 'South America', 'continent_id' => 4],
    ];

    foreach ($regions as $data) {
      Region::factory()->create([
        'name' => $data['name'],
        'continent_id' => $data['continent_id'],
      ]);
    }
  }
}
