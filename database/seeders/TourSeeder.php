<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tour;
use App\Models\TourCategory;
use App\Models\User;

class TourSeeder extends Seeder
{
  public function run(): void
  {
    // Ambil semua user vendor (termasuk root jika type=vendor)
    $vendors = User::where('type', 'vendor')->get();

    // Tambahkan 3 vendor random
    $vendors = $vendors->concat(
      User::factory()
        ->count(3)
        ->state(['type' => 'vendor'])
        ->create()
    );

    $vendors->each(function (User $user) {

      // 1️⃣ Buat 3 kategori untuk vendor ini
      $categories = TourCategory::factory()
        ->count(3)
        ->for($user)
        ->create();

      // 2️⃣ Buat 10 tour untuk vendor ini
      Tour::factory()
        ->count(10)
        ->active()
        ->for($user)
        ->make()
        ->each(function (Tour $tour) use ($categories) {
          // Assign random category
          $tour->category_id = $categories->random()->id;
          $tour->save();
        });
    });
  }
}
