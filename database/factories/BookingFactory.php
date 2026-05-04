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
            'booking_number' => 'BKG-'.strtoupper($this->faker->unique()->bothify('?????-#####')),
            'user_id' => User::factory(),
            'vendor_id' => Company::factory(),
            'agent_id' => null,
            'tour_id' => Tour::factory(),
            'departure_date' => $this->faker->dateTimeBetween('+1 week', '+1 month')->format('Y-m-d'),
            'status' => $this->faker->randomElement(BookingStatus::cases()),
            'pax_adult' => $this->faker->numberBetween(1, 4),
            'pax_child' => $this->faker->numberBetween(0, 2),
            'pax_infant' => $this->faker->numberBetween(0, 1),
            'total_price' => $this->faker->randomFloat(2, 100, 10000),
            'tax_amount' => $this->faker->randomFloat(2, 10, 500),
            'platform_fee' => $this->faker->randomFloat(2, 5, 50),
            'commission_amount' => $this->faker->randomFloat(2, 5, 200),
            'grand_total' => $this->faker->randomFloat(2, 150, 11000),
        ];
    }
}
