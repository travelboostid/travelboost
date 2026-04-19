<?php

namespace Database\Factories;

use App\Enums\UserGender;
use App\Models\Booking;
use App\Models\BookingPassenger;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BookingPassenger>
 */
class BookingPassengerFactory extends Factory
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
            'booking_id' => Booking::factory(),
            'first_name' => $this->faker->firstName($gender),
            'last_name' => $this->faker->lastName(),
            'gender' => $gender,
            'dob' => $this->faker->dateTimeBetween('-60 years', '-1 year')->format('Y-m-d'),
            'pob' => $this->faker->city(),
            'room_type' => $this->faker->randomElement(['Single', 'Double', 'Twin', 'Extra Bed', 'Triple', null]),
            'room_number' => $this->faker->optional(0.3)->bothify('##?'),
            'passport_file_path' => null,
            'visa_file_path' => null,
        ];
    }
}
