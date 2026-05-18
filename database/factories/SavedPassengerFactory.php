<?php

namespace Database\Factories;

use App\Enums\UserGender;
use App\Models\SavedPassenger;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SavedPassenger>
 */
class SavedPassengerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $gender = $this->faker->randomElement([UserGender::MALE->value, UserGender::FEMALE->value]);

        return [
            'user_id' => User::factory(),
            'title' => $gender === UserGender::MALE->value ? 'Mr' : 'Ms',
            'first_name' => $this->faker->firstName($gender),
            'last_name' => $this->faker->lastName(),
            'gender' => $gender,
            'dob' => $this->faker->dateTimeBetween('-60 years', '-1 year')->format('Y-m-d'),
            'pob' => $this->faker->city(),
            'passport_number' => $this->faker->optional(0.7)->passthrough($this->faker->numerify('A########')),
            'passport_issue_date' => $this->faker->optional(0.7)->dateTimeBetween('-5 years', '-1 year')?->format('Y-m-d'),
            'passport_expiry_date' => $this->faker->optional(0.7)->dateTimeBetween('+1 year', '+8 years')?->format('Y-m-d'),
            'visa_number' => $this->faker->optional(0.4)->bothify('VISA-#####'),
            'passport_file_path' => null,
            'visa_file_path' => null,
        ];
    }
}
