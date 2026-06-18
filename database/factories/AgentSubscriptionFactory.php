<?php

namespace Database\Factories;

use App\Models\AgentSubscription;
use App\Models\AgentSubscriptionPackage;
use App\Models\Company;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AgentSubscription>
 */
class AgentSubscriptionFactory extends Factory
{
    protected $model = AgentSubscription::class;

    public function definition(): array
    {
        $startedAt = now()->subMonth();

        return [
            'company_id' => Company::factory(),
            'package_id' => AgentSubscriptionPackage::factory(),
            'started_at' => $startedAt,
            'ended_at' => $startedAt->copy()->addYear(),
        ];
    }

    public function active(): static
    {
        return $this->state(fn (): array => [
            'started_at' => now()->subMonth(),
            'ended_at' => now()->addYear(),
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn (): array => [
            'started_at' => now()->subYear(),
            'ended_at' => now()->subMonth(),
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (): array => [
            'started_at' => null,
            'ended_at' => null,
        ]);
    }
}
