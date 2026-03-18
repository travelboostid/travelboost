<?php

namespace App\Http\Requests\Companies;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
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
      'username' => 'nullable|string|max:255|unique:companies,username,' . $this->company->id,
      'subdomain' => 'nullable|string|max:255|unique:companies,subdomain,' . $this->company->id,
      'name' => 'required|string|max:255',
      'phone' => 'nullable|string|max:20',
      'customer_service_phone' => 'nullable|string|max:20',
      'address' => 'nullable|string|max:255',
      'photo_id' => 'nullable|exists:medias,id',
    ];
  }
}
