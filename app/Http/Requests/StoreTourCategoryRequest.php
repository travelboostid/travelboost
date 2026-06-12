<?php

namespace App\Http\Requests;

use App\Models\Company;
use App\Models\TourCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreTourCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        $company = $this->route('company');

        return Auth::check()
            && $company instanceof Company
            && $this->user()->can('create', TourCategory::class)
            && $company->teams()->where('user_id', $this->user()->id)->exists();
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'position_no' => ['required', 'integer', 'min:0'],
            'manual_reserved_limit_value' => ['nullable', 'integer', 'min:1'],
            'manual_reserved_limit_unit' => ['nullable', 'in:minute,hour'],
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => 'category name',
            'description' => 'description',
            'position_no' => 'position no',
            'manual_reserved_limit_value' => 'manual reserved limit value',
            'manual_reserved_limit_unit' => 'manual reserved limit unit',
        ];
    }
}
