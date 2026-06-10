<?php

namespace App\Http\Requests\Customers;

use App\Models\Company;
use App\Support\Rules\UserRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Context;
use Illuminate\Validation\ValidationException;

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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => UserRules::name(),
            'username' => UserRules::username($this->input('company_id')),
            'email' => UserRules::email($this->input('company_id')),
            'password' => UserRules::password(),
            'company_id' => [
                'required',
                'integer',
            ],
        ];
    }

    protected function failedAuthorization()
    {
        throw ValidationException::withMessages([
            'email' => 'Registration is not allowed.',
        ]);
    }

    private function getCompanyIdFromDomain()
    {
        $domain = Context::get('domain');
        if ($domain && $domain->owner instanceof Company) {
            return $domain->owner_id;
        }

        return null;
    }
}
