<?php

namespace Database\Factories;

use App\Enums\UserType;
use App\Models\User;
use App\Models\UserPreference;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
  /**
   * The current password being used by the factory.
   */
  protected static ?string $password;

  /**
   * Configure the factory.
   */
  public function configure(): static
  {
    return $this->afterCreating(function (User $user) {
      // Create user preference after user is created
      UserPreference::factory()->create(['user_id' => $user->id]);
    });
  }

  /**
   * Define the model's default state.
   *
   * @return array<string, mixed>
   */
  public function definition(): array
  {
    return [
      'name' => fake()->name(),
      'email' => fake()->unique()->safeEmail(),
      'email_verified_at' => now(),
      'password' => static::$password ??= Hash::make('password'),
      'remember_token' => Str::random(10),
      'two_factor_secret' => null,
      'two_factor_recovery_codes' => null,
      'two_factor_confirmed_at' => null,
      'type' => $this->faker->randomElement([
        UserType::Agent,
        UserType::Vendor,
      ]),
      'username' => fake()->userName(),
      'phone' => $this->faker->phoneNumber(),
      'address' => $this->faker->address(),
    ];
  }

  /**
   * Indicate that the model's email address should be unverified.
   */
  public function unverified(): static
  {
    return $this->state(fn(array $attributes) => [
      'email_verified_at' => null,
    ]);
  }

  /**
   * Indicate that the model has two-factor authentication configured.
   */
  public function withTwoFactor(): static
  {
    return $this->state(fn(array $attributes) => [
      'two_factor_secret' => encrypt('secret'),
      'two_factor_recovery_codes' => encrypt(json_encode(['recovery-code-1'])),
      'two_factor_confirmed_at' => now(),
    ]);
  }

  /**
   * Create a user with specific type.
   */
  public function agent(): static
  {
    return $this->state(fn(array $attributes) => [
      'type' => UserType::Agent,
    ]);
  }

  /**
   * Create a user with specific type.
   */
  public function vendor(): static
  {
    return $this->state(fn(array $attributes) => [
      'type' => UserType::Vendor,
    ]);
  }

  /**
   * Create a user without preferences (for testing purposes).
   */
  public function withoutPreferences(): static
  {
    return $this->afterCreating(function (User $user) {
      // Do not create preferences
    });
  }

  /**
   * Create a user with specific preferences.
   */
  public function withPreferences(array $preferences = []): static
  {
    return $this->afterCreating(function (User $user) use ($preferences) {
      UserPreference::factory()->create(array_merge(
        ['user_id' => $user->id],
        $preferences
      ));
    });
  }
}
