<?php
// database/factories/ChatRoomMemberFactory.php
namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ChatRoomMemberFactory extends Factory
{
  public function definition(): array
  {
    $joinedDate = fake()->dateTimeBetween('-6 months', '-1 day');

    return [
      'role' => fake()->randomElement(['member', 'admin', 'owner']),
      'joined_at' => $joinedDate,
      'last_read_at' => fake()->optional(0.7)->dateTimeBetween($joinedDate, 'now'),
      'created_at' => $joinedDate,
      'updated_at' => fake()->dateTimeBetween($joinedDate, 'now'),
    ];
  }

  public function owner(): static
  {
    return $this->state(fn(array $attributes) => [
      'role' => 'owner',
    ]);
  }

  public function admin(): static
  {
    return $this->state(fn(array $attributes) => [
      'role' => 'admin',
    ]);
  }

  public function member(): static
  {
    return $this->state(fn(array $attributes) => [
      'role' => 'member',
    ]);
  }
}
