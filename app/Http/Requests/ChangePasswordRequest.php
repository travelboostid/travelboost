<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class ChangePasswordRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    return [
      'current_password' => ['required', 'current_password'],
      'password' => [
        'required',
        'confirmed',
        'different:current_password',
        Password::min(8),
      ],
    ];
  }

  public function messages(): array
  {
    return [
      'current_password.required' => 'Current password is required.',
      'current_password.current_password' => 'The current password is incorrect.',
      'password.required' => 'New password is required.',
      'password.confirmed' => 'Passwords do not match.',
      'password.different' => 'New password must be different from current password.',
    ];
  }
}
