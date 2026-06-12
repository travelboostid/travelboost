<?php

namespace App\Http\Requests;

use App\Models\TourCategory;
use Illuminate\Foundation\Http\FormRequest;

class UpdateTourCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        $category = $this->route('category');

        return $category instanceof TourCategory
            && $this->user()->can('update', $category);
    }

    public function rules(): array
    {
        return [
            'name' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'position_no' => ['nullable', 'integer', 'min:0'],
            'manual_reserved_limit_value' => ['nullable', 'integer', 'min:1'],
            'manual_reserved_limit_unit' => ['nullable', 'in:minute,hour'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->replace(
            array_filter($this->all(), fn ($v) => ! is_null($v))
        );
    }
}
