<?php

namespace App\Http\Requests\Companies;

use App\Enums\CompanyTeamStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexCompanyTeamRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'status' => array_filter(explode(',', (string) $this->input('status', ''))),
            'role' => array_filter(explode(',', (string) $this->input('role', ''))),
            'sort' => $this->input('sort') ?? '-invited_at',
            'page' => $this->input('page') ?? 1,
            'per_page' => $this->input('per_page') ?? 10,
        ]);
    }

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'user' => ['nullable', 'string', 'max:255'],
            'username' => ['nullable', 'string', 'max:255'],
            'role' => ['nullable', 'array'],
            'role.*' => ['string', 'max:255'],
            'status' => ['nullable', 'array'],
            'status.*' => ['string', Rule::enum(CompanyTeamStatus::class)],
            'invited_at' => ['nullable', 'string', 'max:255'],
            'sort' => ['nullable', 'string', 'max:255'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
