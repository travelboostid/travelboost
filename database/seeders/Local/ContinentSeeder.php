<?php

namespace Database\Seeders\Local;

use App\Models\Continent;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

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
