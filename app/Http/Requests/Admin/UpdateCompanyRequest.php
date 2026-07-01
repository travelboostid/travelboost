<?php

namespace App\Http\Requests\Admin;

use App\Models\Company;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Company $company */
        $company = $this->route('agent') ?? $this->route('vendor');
        $usernameChanged = $this->filled('username')
            && $this->input('username') !== $company->username;

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'username' => [
                'sometimes',
                'string',
                'regex:/^[a-zA-Z0-9_]{3,255}$/',
                'max:255',
                Rule::unique('companies', 'username')->ignore($company->id),
                Rule::when($usernameChanged, Rule::unique('users', 'username')),
            ],
            'email' => [
                'sometimes',
                'string',
                'email',
                'max:255',
                Rule::unique('companies', 'email')->ignore($company->id),
            ],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'customer_service_phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'note' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'photo_id' => ['sometimes', 'nullable', 'integer', 'exists:medias,id'],
            'allow_package_one_agents' => ['sometimes', 'boolean'],
        ];
    }
}
