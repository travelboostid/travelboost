<?php

namespace App\Http\Requests\Webapi\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class SearchResourceOwnersRequest extends FormRequest
{
    public function prepareForValidation(): void
    {
        $includeIds = collect(explode(',', $this->input('include_ids', '')))
            ->filter();

        $mapIds = fn (string $type) => $includeIds
            ->filter(fn ($id) => Str::startsWith($id, "{$type}:"))
            ->map(fn ($id) => Str::after($id, "{$type}:"))
            ->values()
            ->all();

        $this->merge([
            'types' => array_filter(explode(',', $this->input('types', ''))),

            'include_user_ids' => $mapIds('user'),
            'include_company_ids' => $mapIds('company'),
            'include_affiliate_ids' => $mapIds('affiliate'),

            'limit' => $this->integer('limit', 10),
        ]);
    }

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'types' => ['nullable', 'array'],
            'types.*' => ['string', Rule::in(['user', 'company', 'affiliate'])],
            'include_ids' => ['nullable', 'string'],
            'include_user_ids' => ['nullable', 'array'],
            'include_user_ids.*' => ['integer'],
            'include_company_ids' => ['nullable', 'array'],
            'include_company_ids.*' => ['integer'],
            'include_affiliate_ids' => ['nullable', 'array'],
            'include_affiliate_ids.*' => ['integer'],
            'keyword' => ['nullable', 'string', 'max:100'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
