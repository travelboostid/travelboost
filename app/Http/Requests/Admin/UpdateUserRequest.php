<?php

namespace App\Http\Requests\Admin;

use App\Support\Rules\UserRules;
use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
  /**
   * Determine if the user is authorized to make this request.
   */
  public function authorize(): bool
  {
    return true;
  }

  /**
   * Get the validation rules that apply to the request.
   *
   * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
   */
  public function rules(): array
  {
    $user = $this->route('user');
    return [
      'name' => ['sometimes', 'string', 'max:255'],
      'username' => UserRules::username($user->tenant_id, $user->id),
      'email' => UserRules::email($user->tenant_id, $user->id),
      'phone' => ['sometimes', 'string', 'max:20'],
      'address' => ['sometimes', 'string', 'max:255'],
      'gender' => ['sometimes', 'in:male,female,unspecified'],
      'status' => ['sometimes', 'in:active,inactive,suspended'],
    ];
  }
}
