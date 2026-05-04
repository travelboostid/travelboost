<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
  public function authorize(): bool
  {
    return Auth::check();
  }

  public function rules(): array
  {
    $userId = $this->user()->id;

    return [
      'name' => ['sometimes', 'string', 'max:255'],

      'username' => [
        'sometimes',
        'string',
        'max:255',
        Rule::unique('users', 'username')->ignore($userId),
      ],

      'email' => [
        'sometimes',
        'email',
        'max:255',
        Rule::unique('users', 'email')->ignore($userId),
      ],

      'phone' => ['sometimes', 'string', 'max:50'],

      'address' => ['sometimes', 'string', 'max:500'],

      'photo_id' => [
        'sometimes',
        'nullable',
        'integer',
        'exists:medias,id',
      ],

      // Optional password update
      'password' => [
        'sometimes',
        'string',
        'min:8',
        'confirmed',
      ],
    ];
  }

  protected function prepareForValidation()
  {
    $this->replace(
      array_filter($this->all(), fn($v) => !is_null($v))
    );
  }
}
