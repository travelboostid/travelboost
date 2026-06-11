<?php

namespace App\Http\Requests\Admin;

use App\Enums\TourStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkUpdateTourProductRequest extends FormRequest
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
            'ids.*' => ['integer', 'exists:tours,id'],
            'status' => ['required', Rule::in([
                TourStatus::ACTIVE->value,
                TourStatus::INACTIVE->value,
            ])],
        ];
    }
}
