<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class IndexVendorRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
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
            'username' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'created_at' => ['nullable', 'string', 'max:255'],
            'sort' => [
                'nullable',
                'string',
                'max:255',
                function ($attribute, $value, $fail): void {
                    $allowed = [
                        'id',
                        'name',
                        'email',
                        'username',
                        'phone',
                        'address',
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
