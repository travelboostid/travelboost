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
            'position_no' => ['nullable', 'string'],
        ];
    }

    protected function prepareForValidation()
    {
        $this->replace(
            array_filter($this->all(), fn ($v) => ! is_null($v))
        );
    }
}
