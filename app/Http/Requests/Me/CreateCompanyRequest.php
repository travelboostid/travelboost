<?php

namespace App\Http\Requests\Me;

use Illuminate\Foundation\Http\FormRequest;

class CreateCompanyRequest extends FormRequest
{
  /**
   * Determine if the user is authorized to make this request.
   */
  public function authorize(): bool
  {
    return true;
  }

  /**
   * Prepare the data for validation.
   */
  protected function prepareForValidation(): void
  {
    $this->merge([
      'username' => strtolower($this->username),
      'subdomain' => strtolower($this->username),
      'email' => strtolower($this->email),
    ]);
  }

  /**
   * Get the validation rules that apply to the request.
   *
   * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
   */
  public function rules(): array
  {
    return [
      'name' => ['required', 'string', 'max:255'],
      'username' => ['required', 'string', 'max:255', 'regex:/^[a-z][a-z0-9-]*$/', 'unique:companies,username'],
      'email' => ['required', 'string', 'email', 'max:255', 'unique:companies,email'],
      'photo_id' => ['nullable', 'integer', 'exists:media,id'],
      'phone' => ['nullable', 'string', 'max:255'],
      'customer_service_phone' => ['nullable', 'string', 'max:255'],
      'address' => ['nullable', 'string', 'max:255'],
      'subdomain' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9]+$/', 'unique:companies,subdomain'],
    ];
  }
}
