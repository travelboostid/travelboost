<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\TourCategory;
use App\Models\User;
use App\Models\Vendor;
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
