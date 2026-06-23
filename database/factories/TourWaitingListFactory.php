<?php

namespace Database\Factories;

use App\Enums\TourWaitingListStatus;
use App\Models\Company;
use App\Models\Tour;
use App\Models\TourWaitingList;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TourWaitingList>
 */
class TourWaitingListFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tour_id' => Tour::factory()->state([
                'company_id' => Company::factory()->state(['type' => 'vendor']),
            ]),
            'vendor_id' => fn (array $attributes): int => (int) Tour::query()->findOrFail($attributes['tour_id'])->company_id,
            'created_by_user_id' => User::factory(),
            'created_by_company_id' => null,
            'customer_user_id' => null,
            'contact_name' => fake()->name(),
            'contact_phone' => fake()->phoneNumber(),
            'contact_email' => fake()->safeEmail(),
            'contact_address' => fake()->optional()->address(),
            'status' => TourWaitingListStatus::PENDING,
        ];
    }
}
