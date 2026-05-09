<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class IndexUserRequest extends FormRequest
{

  public function prepareForValidation()
  {
    $this->merge([
      'sort' => $this->input('sort') ?? '-id',
      'page' => $this->input('page') ?? 1,
      'per_page' => $this->input('per_page') ?? 10,
    ]);
  }
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
    return [
      'name' => 'nullable|string|max:255',
      'email' => 'nullable|string|email|max:255',
      'username' => 'nullable|string|max:255',
      'phone' => 'nullable|string|max:255',
      'roles' => 'nullable|string|max:255',
      'address' => 'nullable|string|max:255',
      'status' => 'nullable|string|max:255',
      'created_at' => 'nullable|string|max:255',
      'sort' => [
        'nullable',
        'string',
        'max:255',
        function ($attribute, $value, $fail) {
          $allowed = [
            'id',
            'name',
            'email',
            'username',
            'phone',
            'address',
            'status',
            'created_at',
          ];

          foreach (explode(',', $value) as $sort) {
            $field = ltrim($sort, '-');

            if (! in_array($field, $allowed)) {
              $fail("Invalid sort field [$field].");
            }
          }
        },
      ],
      'page' => 'nullable|integer|min:1',
      'per_page' => 'nullable|integer|min:1|max:100',
    ];
  }
}
