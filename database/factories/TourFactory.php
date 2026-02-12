<?php

namespace Database\Factories;

use App\Enums\TourStatus;
use App\Models\Tour;
use App\Models\TourCategory;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Tour>
 */
class TourFactory extends Factory
{
  protected $model = Tour::class;

  public function definition(): array
  {
    return [
      'code' => 'TOUR-' . $this->faker->unique()->numberBetween(1000, 9999),
      'name' => $this->faker->sentence(3),
      'description' => $this->faker->paragraph(),

      'duration_days' => $this->faker->numberBetween(2, 14),

      'status' => $this->faker->randomElement([
        TourStatus::Active,
        TourStatus::Inactive,
      ]),

      'continent' => 'Asia',
      'region' => $this->faker->randomElement([
        'Southeast Asia',
        'East Asia',
      ]),
      'country' => $this->faker->randomElement([
        'Indonesia',
        'Japan',
        'Thailand',
        'Vietnam',
      ]),
      'destination' => $this->faker->city(),

      'category_id' => TourCategory::factory(),
      'user_id' => User::factory(),
    ];
  }

  /*
    |--------------------------------------------------------------------------
    | States
    |--------------------------------------------------------------------------
    */

  public function active(): static
  {
    return $this->state(fn() => [
      'status' => TourStatus::Active,
    ]);
  }

  public function inactive(): static
  {
    return $this->state(fn() => [
      'status' => TourStatus::Inactive,
    ]);
  }
}
