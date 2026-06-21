<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Tour;
use App\Models\TourAddOn;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TourAddOn>
 */
class TourAddOnFactory extends Factory
{
    protected $model = TourAddOn::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'tour_id' => Tour::factory(),
            'description' => fake()->randomElement(['Travel Insurance', 'Extra Baggage', 'Airport Transfer']),
            'price' => fake()->randomFloat(2, 50_000, 500_000),
            'edit_status' => false,
            'is_taxable' => true,
        ];
    }
}
