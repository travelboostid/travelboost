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
        $gender = fake()->randomElement([UserGender::MALE->value, UserGender::FEMALE->value]);

        return [
            'user_id' => User::factory(),
            'title' => $gender === UserGender::MALE->value ? 'Mr' : 'Ms',
            'first_name' => fake()->firstName($gender),
            'last_name' => fake()->lastName(),
            'gender' => $gender,
            'dob' => fake()->dateTimeBetween('-60 years', '-1 year')->format('Y-m-d'),
            'pob' => fake()->city(),
            'passport_number' => fake()->optional(0.7)->passthrough(fake()->numerify('A########')),
            'passport_issue_date' => fake()->optional(0.7)->dateTimeBetween('-5 years', '-1 year')?->format('Y-m-d'),
            'passport_expiry_date' => fake()->optional(0.7)->dateTimeBetween('+1 year', '+8 years')?->format('Y-m-d'),
            'visa_number' => fake()->optional(0.4)->bothify('VISA-#####'),
            'passport_file_path' => null,
            'visa_file_path' => null,
        ];
    }
}
