<?php

namespace Database\Factories;

use App\Enums\TourStatus;
use App\Models\AgentSubscriptionPackage;
use App\Models\Tour;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AgentSubscriptionPackage>
 */
class AgentSubscriptionPackageFactory extends Factory
{
  protected $model = AgentSubscriptionPackage::class;
  public function definition(): array
  {
    return [
      'name' => $this->faker->sentence(3),
      'duration_months' => $this->faker->numberBetween(1, 12),
      'price' => $this->faker->randomFloat(2, 100000, 1000000),
      'is_active' => true,
    ];
  }
}
