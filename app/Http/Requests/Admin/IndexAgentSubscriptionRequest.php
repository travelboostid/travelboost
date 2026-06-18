<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexAgentSubscriptionRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'company' => array_filter(explode(',', (string) $this->input('company', ''))),
            'status' => array_filter(explode(',', (string) $this->input('status', ''))),
            'sort' => $this->input('sort') ?? '-id',
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
            'company' => ['nullable', 'array'],
            'company.*' => ['integer'],
            'status' => ['nullable', 'array'],
            'status.*' => ['string', Rule::in(['active', 'expired', 'inactive'])],
            'started_at' => ['nullable', 'string', 'max:255'],
            'ended_at' => ['nullable', 'string', 'max:255'],
            'sort' => [
                'nullable',
                'string',
                'max:255',
                function ($attribute, $value, $fail): void {
                    $allowed = [
                        'id',
                        'started_at',
                        'ended_at',
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
