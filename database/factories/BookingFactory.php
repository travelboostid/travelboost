<?php

namespace Database\Factories;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Company;
use App\Models\Tour;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Booking>
 */
class BookingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'booking_number' => 'BKG-'.strtoupper(fake()->unique()->bothify('?????-#####')),
            'user_id' => User::factory(),
            'vendor_id' => Company::factory(),
            'agent_id' => null,
            'tour_id' => Tour::factory(),
            'departure_date' => fake()->dateTimeBetween('+1 week', '+1 month')->format('Y-m-d'),
            'status' => fake()->randomElement(BookingStatus::cases()),
            'pax_adult' => fake()->numberBetween(1, 4),
            'pax_child' => fake()->numberBetween(0, 2),
            'pax_infant' => fake()->numberBetween(0, 1),
            'total_price' => fake()->randomFloat(2, 100, 10000),
            'tax_rate' => 0,
            'tax_amount' => fake()->randomFloat(2, 10, 500),
            'platform_fee' => fake()->randomFloat(2, 5, 50),
            'commission_amount' => fake()->randomFloat(2, 5, 200),
            'grand_total' => fake()->randomFloat(2, 150, 11000),
        ];
    }
}
