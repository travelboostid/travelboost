<?php

namespace App\Http\Requests\Companies;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRoleRequest extends FormRequest
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
    return [
      'name' => 'sometimes|nullable|string|max:255',
      'display_name' => 'sometimes|nullable|string|max:255',
      'description' => 'sometimes|nullable|string|max:255',
      'permissions' => 'sometimes|array',
      'permissions.*' => 'sometimes|boolean',
    ];
  }
}
