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
    $user = $this->user();
    $role = $this->route('role');
    $company = $this->route('company');

    if (!$role || !$company || !$user) {
      return false;
    }
    // Check if user has permission to update roles in this company
    if (!$user->hasPermission('role.update', "company:{$company->id}")) {
      return false;
    }

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
      'permissions' => 'array',
      'permissions.*' => 'boolean',
    ];
  }
}
