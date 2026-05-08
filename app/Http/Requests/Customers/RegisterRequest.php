<?php

namespace App\Http\Requests\Customers;

use App\Support\Rules\UserRules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Context;

class RegisterRequest extends FormRequest
{
  /**
   * Prepare the data for validation before any validation rules are applied.
   */
  protected function prepareForValidation(): void
  {
    $companyId = $this->getCompanyIdFromDomain();
    $this->merge([
      'company_id' => $companyId,
      'username' => strtolower($this->input('username')),
      'email' => strtolower($this->input('email')),
    ]);
  }

  /**
   * Determine if the user is authorized to make this request.
   */
  public function authorize(): bool
  {
    return $this->input('company_id') !== null;
  }

  /**
   * Get the validation rules that apply to the request.
   *
   * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
   */
  public function rules(): array
  {
    return [
      'name' => UserRules::name(),
      'username' => UserRules::username(),
      'email' => UserRules::email(),
      'password' => UserRules::password(),
      'company_id' => [
        'required',
        'integer',
      ],
    ];
  }

  protected function failedAuthorization()
  {
    throw \Illuminate\Validation\ValidationException::withMessages([
      'email' => 'Registration is not allowed.',
    ]);
  }

  private function getCompanyIdFromDomain()
  {
    $domain = Context::get('domain');
    if ($domain && $domain->owner instanceof \App\Models\Company) {
      return $domain->owner_id;
    }
    return null;
  }
}
