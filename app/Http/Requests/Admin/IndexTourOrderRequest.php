<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class IndexTourOrderRequest extends FormRequest
{
    public function prepareForValidation(): void
    {
        $this->merge([
            'status' => array_filter(explode(',', $this->input('status', ''))),
            'vendor' => array_filter(explode(',', $this->input('vendor', ''))),
            'agent' => array_filter(explode(',', $this->input('agent', ''))),
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
            'booking_number' => ['nullable', 'string'],
            'contact_name' => ['nullable', 'string'],
            'status' => ['nullable', 'array'],
            'vendor' => ['nullable', 'array'],
            'agent' => ['nullable', 'array'],
            'created_at' => ['nullable', 'string', 'max:255'],
            'departure_date' => ['nullable', 'string', 'max:255'],
            'sort' => ['nullable', 'string', 'max:255'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
