<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
// use App\Models\UserPreference;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
  use PasswordValidationRules, ProfileValidationRules;

  /**
   * Validate and create a newly registered user.
   *
   * @param  array<string, string>  $input
   */
  public function create(array $input): User
  {
    $tenant = request()->attributes->get('tenant');
    $companyId = $tenant == null ? null : $tenant->id;
    Validator::make($input, [
      ...$this->profileRules(),
      'password' => $this->passwordRules(),
    ])->validate();
    $data = collect($input)->only([
      'name',
      'email',
      'username',
      'phone',
      'address',
    ])->toArray();

    $data['company_id'] = $companyId;
    $data['password'] = $input['password'];

    $user = User::create($data);


    return $user;
  }
}
