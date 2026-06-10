<?php

namespace Database\Factories;

use App\Models\AgentSubscriptionPackage;
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
            'name' => fake()->unique()->words(2, true),
            'duration_months' => 1,
            'price' => fake()->numberBetween(100000, 500000),
            'is_active' => true,
        ];
    }
}
