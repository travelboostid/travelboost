<?php

namespace App\Http\Requests\Companies;

use App\Enums\UserGender;
use App\Enums\UserStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CustomerIndexRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'status' => array_filter(explode(',', (string) $this->input('status', ''))),
            'gender' => array_filter(explode(',', (string) $this->input('gender', ''))),
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
            'username' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'max:255'],
            'agent_name' => ['nullable', 'string', 'max:255'],
            'registration_source' => ['nullable', 'string', Rule::in(['direct', 'agent'])],
            'status' => ['nullable', 'array'],
            'status.*' => ['string', Rule::enum(UserStatus::class)],
            'gender' => ['nullable', 'array'],
            'gender.*' => ['string', Rule::enum(UserGender::class)],
            'created_at' => ['nullable', 'string', 'max:255'],
            'sort' => ['nullable', 'string', 'max:255'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
