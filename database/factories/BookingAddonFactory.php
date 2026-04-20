<?php

namespace Database\Factories;

use App\Models\Booking;
use App\Models\BookingAddon;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BookingAddon>
 */
class BookingAddonFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'booking_id' => Booking::factory(),
            'name' => $this->faker->randomElement(['Extra Baggage', 'Travel Insurance', 'Airport Transfer', 'VIP Welcome']),
            'price' => $this->faker->randomFloat(2, 50, 500),
        ];
    }
}
