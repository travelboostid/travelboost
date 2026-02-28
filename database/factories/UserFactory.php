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
   * Define the model's default state.
   *
   * @return array<string, mixed>
   */
  public function definition(): array
  {
    return [
      'company_id' => null,
      'name' => fake()->name(),
      'email' => fake()->unique()->safeEmail(),
      'email_verified_at' => now(),
      'password' => static::$password ??= Hash::make('password'),
      'remember_token' => Str::random(10),
      'two_factor_secret' => null,
      'two_factor_recovery_codes' => null,
      'two_factor_confirmed_at' => null,
      'username' => fake()->userName(),
      'phone' => $this->faker->phoneNumber(),
      'address' => $this->faker->address(),
    ];
  }
}
