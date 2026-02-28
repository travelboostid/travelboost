<?php

namespace Database\Seeders\Local;

use App\Models\Company;
use App\Models\Tour;
use App\Models\TourCategory;
use Illuminate\Database\Seeder;

class TourSeeder extends Seeder
{
  public function run(): void
  {
    $root = Company::where('username', 'root')->first();

    if ($root) {
      TourCategory::factory()
        ->count(2)
        ->forCompany($root) // attach to this company
        ->create();

      // Use the TourFactory to create 2 tours
      Tour::factory()
        ->count(2)
        ->for($root, 'company') // attach to the company relation
        ->create();
    }
  }
}
