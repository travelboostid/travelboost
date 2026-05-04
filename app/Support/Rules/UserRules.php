<?php

namespace App\Support\Rules;

use App\Models\User;
use Illuminate\Validation\Rule;

class UserRules
{
  /** Validation rules for user registration and profile updates
   * The tenantId is used to scope the uniqueness of email and username within a company (tenant)
   * The userId is used to ignore the current user's email and username when updating their profile
   */

  public static function name(?int $userId = null)
  {
    return [$userId === null ? 'required' : 'sometimes', 'string', 'max:255'];
  }

  public static function email(?int $tenantId = null, ?int $userId = null)
  {
    return [
      $userId === null ? 'required' : 'sometimes',
      'string',
      'email',
      'max:255',
      $userId === null
        ? Rule::unique(User::class)->where('company_id', $tenantId)
        : Rule::unique(User::class)->where('company_id', $tenantId)->ignore($userId),
    ];
  }

  public static function password()
  {
    return ['required', 'string', 'min:8', 'confirmed'];
  }

  public static function username(?int $tenantId = null, ?int $userId = null)
  {
    return [
      $userId === null ? 'required' : 'sometimes',
      'string',
      'regex:/^[a-zA-Z0-9_]{3,255}$/',
      'max:255',
      $userId === null
        ? Rule::unique(User::class, 'username')->where('company_id', $tenantId)
        : Rule::unique(User::class, 'username')->where('company_id', $tenantId)->ignore($userId),
    ];
  }
}
