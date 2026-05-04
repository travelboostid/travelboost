<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Company;

class CompanyFactory extends Factory
{
  protected $model = Company::class;

  public function definition()
  {
    return [
      'username' =>  $this->faker->userName(),
      'type' => $this->faker->randomElement(['agent', 'vendor']),
      'name' => $this->faker->company(),
      'email' => $this->faker->unique()->companyEmail,
      'address' => $this->faker->address,
      'phone' => $this->faker->phoneNumber,
    ];
  }
}
