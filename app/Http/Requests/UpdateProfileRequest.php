<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateProfileRequest extends FormRequest
{
  /**
   * Determine if the user is authorized to make this request.
   */
  public function authorize(): bool
  {
    return Auth::check();
  }

  /**
   * Get the validation rules that apply to the request.
   */
  public function rules(): array
  {
    $user = Auth::user();

    return [
      'username' => 'nullable|string|max:50|unique:users,username,' . $user->id,
      'name' => 'nullable|string|max:100',
      'phone' => 'nullable|string|max:20',
      'address' => 'nullable|string|max:500',
      'photo_id' => 'nullable|integer',
    ];
  }

  /**
   * Get custom messages for validator errors.
   */
  public function messages(): array
  {
    return [
      'username.unique' => 'This username is already taken.',
      'phone.max' => 'Phone number cannot exceed 20 characters.',
      'address.max' => 'Address cannot exceed 500 characters.',
    ];
  }

  protected function prepareForValidation()
  {
    $this->replace(
      array_filter($this->all(), fn($v) => !is_null($v))
    );
  }
}
