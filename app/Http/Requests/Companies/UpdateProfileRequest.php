<?php

namespace App\Http\Requests\Companies;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $nullableIntegerFields = [
            'photo_id',
            'province_id',
            'city_id',
            'district_id',
            'village_id',
            'identity_card_id',
        ];

        $data = [];

        foreach ($nullableIntegerFields as $field) {
            if (in_array($this->input($field), ['', '0', 0], true)) {
                $data[$field] = null;
            }
        }

        $emptyStringDefaults = [
            'customer_service_phone',
        ];

        foreach ($emptyStringDefaults as $field) {
            if ($this->input($field) === null) {
                $data[$field] = '';
            }
        }

        if (! $this->boolean('domain_enabled')) {
            $data['domain'] = null;
        }

        if ($data !== []) {
            $this->merge($data);
        }
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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $company = $this->company;
        $domain = $company?->domain;
        $usernameChanged = filled($this->input('username'))
            && $this->input('username') !== $company?->username;

        return [
            'username' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('companies', 'username')->ignore($company->id),
                Rule::when($usernameChanged, Rule::unique('users', 'username')),
            ],
            'subdomain' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('domains', 'subdomain')
                    ->ignore($domain?->id),
            ],
            'domain_enabled' => [
                'sometimes',
                'boolean',
            ],
            'domain' => [
                Rule::requiredIf(fn () => $this->boolean('domain_enabled')),
                'nullable',
                'string',
                'max:255',
                'regex:/^(?=.{1,253}$)(?!-)(?:[a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,63}$/',
                Rule::unique('domains', 'domain')
                    ->ignore($domain?->id),
            ],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('companies', 'email')->ignore($this->company->id),
            ],
            'name' => [
                'required',
                'string',
                'max:255',
            ],
            'phone' => [
                'required',
                'string',
                'max:20',
            ],
            'customer_service_phone' => [
                'nullable',
                'string',
                'max:20',
            ],
            'address' => [
                'required',
                'string',
                'max:255',
            ],
            'photo_id' => [
                'nullable',
                'exists:medias,id',
            ],
            'province_id' => [
                'nullable',
                'exists:'.config('laravolt.indonesia.table_prefix').'provinces,id',
            ],
            'city_id' => [
                'nullable',
                'exists:'.config('laravolt.indonesia.table_prefix').'cities,id',
            ],
            'district_id' => [
                'nullable',
                'exists:'.config('laravolt.indonesia.table_prefix').'districts,id',
            ],
            'village_id' => [
                'nullable',
                'exists:'.config('laravolt.indonesia.table_prefix').'villages,id',
            ],
            'identity_card_id' => ['nullable', 'exists:medias,id'],
            'postal_code' => [
                'nullable',
                'string',
                'max:20', ],
            'identity_number' => 'nullable|string|size:16',
        ];
    }

    // public function withValidator(Validator $validator)
    // {
    //   $validator->after(function ($validator) {
    //     $domain = $this->input('domain');

    //     // skip if domain_enabled is false or not present
    //     if (!$this->boolean('domain_enabled')) {
    //       return true;
    //     }

    //     if (!$domain) return;

    //     // skip if domain hasn't changed or is same as current domain (to allow saving other fields without changing domain)
    //     if ($this->company && $domain === optional($this->company->domain)->domain) {
    //       return;
    //     }

    //     if (!$this->verifyDomainOwnership($domain)) {
    //       $validator->errors()->add(
    //         'domain',
    //         "Domain ownership verification failed. Please read the instructions to verify your domain ownership."
    //       );
    //     }
    //   });
    // }
    // protected function verifyDomainOwnership(string $domain): bool
    // {
    //   $records = dns_get_record($domain, DNS_A) ?: [];
    //   $expectedIp = request()->server('SERVER_ADDR');

    //   return collect($records)
    //     ->pluck('ip')
    //     ->contains($expectedIp);
    // }
}
