<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexMasterAffiliateRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'status' => array_filter(explode(',', (string) $this->input('status', ''))),
            'sort' => $this->input('sort') ?? '-created_at',
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
            'name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'referral_code' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'array'],
            'status.*' => ['string', Rule::in(['pending', 'approved', 'rejected', 'suspended'])],
            'created_at' => ['nullable', 'string', 'max:255'],
            'sort' => [
                'nullable',
                'string',
                'max:255',
                function ($attribute, $value, $fail): void {
                    $allowed = [
                        'id',
                        'status',
                        'referral_code',
                        'created_at',
                    ];

                    foreach (explode(',', $value) as $sort) {
                        $field = ltrim($sort, '-');

                        if (! in_array($field, $allowed, true)) {
                            $fail("Invalid sort field [$field].");
                        }
                    }
                },
            ],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
