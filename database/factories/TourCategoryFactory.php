<?php

namespace Database\Factories;

use App\Models\TourCategory;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TourCategory>
 */
class TourCategoryFactory extends Factory
{
  protected $model = TourCategory::class;

  public function definition(): array
  {
    return [
      'name' => $this->faker->unique()->words(2, true),
      'description' => $this->faker->sentence(),
      'user_id' => User::factory(),
    ];
  }
}
