<?php

namespace App\Http\Requests\Customers;

use App\Models\Company;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Context;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Prepare the data for validation before any validation rules are applied.
     */
    protected function prepareForValidation(): void
    {
        $companyId = $this->getCompanyIdFromDomain();
        $this->merge([
            'company_id' => $companyId,
            'username_or_email' => strtolower($this->input('username_or_email')),
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
            'username_or_email' => [
                'required',
                'string',
            ],
            'password' => [
                'required',
                'string',
            ],
            'company_id' => [
                'required',
                'integer',
            ],
        ];
    }

    protected function failedAuthorization()
    {
        throw ValidationException::withMessages([
            'username_or_email' => 'Login is not allowed.',
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
