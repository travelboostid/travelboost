<?php

namespace App\Http\Requests\Companies;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class InviteCompanyTeamRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    $companyId = $this->route('company')?->id;

    return [
      'name' => ['required', 'string', 'max:255'],
      'email' => ['required', 'email', 'max:255', 'unique:users,email'],
      'username' => ['required', 'string', 'max:255', 'unique:users,username'],
      'password' => ['required', 'confirmed', Password::defaults()],
      'role' => [
        'required',
        'string',
        'exists:roles,name',
        function (string $attribute, mixed $value, \Closure $fail) use ($companyId): void {
          if (!is_string($value) || !str_starts_with($value, "company:{$companyId}:")) {
            $fail('The selected role is invalid.');
          }
        },
      ],
    ];
  }
}
