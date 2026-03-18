<?php

namespace App\Concerns;

use App\Models\User;
use Illuminate\Validation\Rule;

trait ProfileValidationRules
{
  /**
   * Get the validation rules used to validate user profiles.
   *
   * @return array<string, array<int, \Illuminate\Contracts\Validation\Rule|array<mixed>|string>>
   */
  protected function profileRules(?int $userId = null): array
  {
    $tenant = request()->attributes->get('tenant');
    $tenantId = $tenant == null ? null : $tenant->id;
    return [
      'name' => ['required', 'string', 'max:255'],
      'username' => [
        'required',
        'string',
        'max:50',
        $userId === null
          ? Rule::unique(User::class, 'username')->where('company_id', $tenantId)
          : Rule::unique(User::class, 'username')->where('company_id', $tenantId)->ignore($userId),
      ],
      'email' => [
        'required',
        'string',
        'email',
        'max:255',
        $userId === null
          ? Rule::unique(User::class)->where('company_id', $tenantId)
          : Rule::unique(User::class)->where('company_id', $tenantId)->ignore($userId),
      ],
      'phone' => [
        'nullable',
        'string',
        'max:20',
        'regex:/^[0-9+\-\s]+$/'
      ],

      'address' => [
        'nullable',
        'string',
        'max:500',
      ],
      'photo_id' => [
        'nullable',
        'int'
      ]
    ];
  }
}
