<?php

namespace Database\Factories;

use App\Models\Company;
use Illuminate\Database\Eloquent\Factories\Factory;

class CompanyFactory extends Factory
{
    protected $model = Company::class;

    public function definition()
    {
        return [
            'username' => strtolower(preg_replace('/[^a-zA-Z0-9]/', '', fake()->unique()->userName())),
            'type' => fake()->randomElement(['agent', 'vendor']),
            'name' => fake()->company(),
            'email' => fake()->unique()->companyEmail,
            'address' => fake()->address,
            'phone' => fake()->phoneNumber,
        ];
    }
}
