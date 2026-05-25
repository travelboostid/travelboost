<?php

namespace Database\Factories;

use App\Enums\TourStatus;
use App\Models\Tour;
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
            'code' => 'TOUR-'.fake()->unique()->numberBetween(1000, 9999),
            'name' => fake()->sentence(3),
            'description' => fake()->paragraph(),

            'duration_days' => fake()->numberBetween(2, 14),

            'status' => fake()->randomElement([
                TourStatus::ACTIVE,
                TourStatus::INACTIVE,
            ]),
            'continent_id' => 1,
            'region_id' => 1,
            'country_id' => 1,
            'destination' => fake()->city(),

            'category_id' => null,
            'company_id' => null,
        ];
    }
}
