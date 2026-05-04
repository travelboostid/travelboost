<?php
// database/factories/ChatRoomFactory.php
namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ChatRoomFactory extends Factory
{
  public function definition(): array
  {
    $type = fake()->randomElement(['private', 'group']);

    return [
      'name' => $type === 'group'
        ? fake()->randomElement([
          'Developers Team',
          'Marketing Squad',
          'Project Alpha',
          'Family Group',
          'Gaming Buddies',
          'Study Group',
          'Book Club',
          'Travel Planning'
        ])
        : null,
      'type' => $type,
      'created_by' => null, // Will be set in seeder
      'created_at' => fake()->dateTimeBetween('-6 months', 'now'),
      'updated_at' => fake()->dateTimeBetween('-6 months', 'now'),
    ];
  }

  public function private(): static
  {
    return $this->state(fn(array $attributes) => [
      'type' => 'private',
      'name' => null,
    ]);
  }

  public function group(): static
  {
    return $this->state(fn(array $attributes) => [
      'type' => 'group',
      'name' => fake()->company() . ' Group',
    ]);
  }
}
