<?php

namespace App\Http\Requests\Companies;

use App\Models\Company;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

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
      //10042026
      'province' => 'nullable|string|max:50',
      'city' => 'nullable|string|max:50',
      'identity_id' => 'nullable|exists:medias,id',
    ];
  }

  public function withValidator(Validator $validator)
  {
    $validator->after(function ($validator) {
      $domain = $this->input('domain');

      // skip if domain_enabled is false or not present
      if (!$this->boolean('domain_enabled')) {
        return;
      }

      if (!$domain) return;

      // skip if domain hasn't changed or is same as current domain (to allow saving other fields without changing domain)
      if ($this->company && $domain === optional($this->company->domain)->domain) {
        return;
      }

      if (!$this->verifyDomainOwnership($domain)) {
        $validator->errors()->add(
          'domain',
          "Domain ownership verification failed. Please read the instructions to verify your domain ownership."
        );
      }
    });
  }
  protected function verifyDomainOwnership(string $domain): bool
  {
    $records = dns_get_record($domain, DNS_A) ?: [];
    $expectedIp = request()->server('SERVER_ADDR');

    return collect($records)
      ->pluck('ip')
      ->contains($expectedIp);
  }
}
