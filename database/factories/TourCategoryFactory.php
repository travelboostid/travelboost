<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\TourCategory;
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
            'company_id' => Company::factory(),
            'name' => fake()->unique()->words(2, true),
            'description' => fake()->sentence(),
        ];
    }

    public function forCompany(Company $company)
    {
        return $this->state(function () use ($company) {
            return [
                'company_id' => $company->id,
            ];
        });
    }
}
