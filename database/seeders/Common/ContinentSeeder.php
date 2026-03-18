<?php

namespace Database\Seeders\Common;

use App\Models\Continent;
use Illuminate\Database\Seeder;

class ContinentSeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    $continents = [
      ['name' => 'Asia'],
      ['name' => 'Europe'],
      ['name' => 'Africa'],
      ['name' => 'America'],
      ['name' => 'Australia'],
    ];

    foreach ($continents as $data) {
      Continent::factory()->create([
        'name' => $data['name']
      ]);
    }
  }
}
