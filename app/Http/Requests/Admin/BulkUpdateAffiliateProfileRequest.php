<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class BulkUpdateAffiliateProfileRequest extends FormRequest
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
        return [
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:affiliate_profiles,id'],
            'status' => ['required', 'in:pending,approved,rejected,suspended'],
            'note' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
