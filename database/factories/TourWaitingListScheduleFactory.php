<?php

namespace Database\Factories;

use App\Models\TourSchedule;
use App\Models\TourWaitingList;
use App\Models\TourWaitingListSchedule;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TourWaitingListSchedule>
 */
class TourWaitingListScheduleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tour_waiting_list_id' => TourWaitingList::factory(),
            'tour_schedule_id' => function (array $attributes): int {
                $waitingList = TourWaitingList::query()->findOrFail($attributes['tour_waiting_list_id']);

                return TourSchedule::query()->create([
                    'tour_id' => $waitingList->tour_id,
                    'company_id' => $waitingList->vendor_id,
                    'departure_date' => now()->addMonth()->toDateString(),
                    'return_date' => now()->addMonth()->addWeek()->toDateString(),
                    'is_active' => true,
                ])->id;
            },
            'preference_order' => 1,
            'available_seats_at_request' => 0,
            'display_price_at_request' => fake()->numberBetween(1_000_000, 20_000_000),
            'pax_adult' => 2,
            'pax_child' => 0,
            'pax_infant' => 0,
            'accepts_partial_fulfillment' => false,
            'minimum_partial_seats' => null,
            'is_priority' => true,
        ];
    }
}
