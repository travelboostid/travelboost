<?php

namespace App\Http\Requests\Admin;

use App\Enums\TourStatus;
use App\Models\Tour;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class AdminUpdateTourRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        /** @var Tour $tour */
        $tour = $this->route('tour');

        return [
            'code' => ['required', 'string', 'max:255'],
            'name' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'duration_days' => ['nullable', 'integer', 'min:1'],
            'status' => ['required', Rule::in([
                TourStatus::ACTIVE->value,
                TourStatus::INACTIVE->value,
            ])],
            'continent_id' => ['nullable', 'exists:continents,id'],
            'region_id' => ['nullable', 'exists:regions,id'],
            'country_id' => ['nullable', 'exists:countries,id'],
            'destination' => ['nullable', 'string', 'max:100'],
            'category_id' => ['nullable', 'exists:tour_categories,id'],
            'product_commission_category_id' => [
                'nullable',
                Rule::exists('product_commission_categories', 'id')
                    ->where('company_id', $tour->company_id),
            ],
            'image_id' => ['nullable', 'exists:medias,id'],
            'document_id' => ['nullable', 'exists:medias,id'],
            'showprice' => ['required', 'numeric', 'min:0'],
            'earlybird' => ['nullable', 'numeric', 'min:0'],
            'earlybird_note' => ['nullable', 'string', 'max:255'],
            'promote_title' => ['nullable', 'string', 'max:255'],
            'promote_note' => ['nullable', 'string', 'max:255'],
            'promote_price' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:10'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $data = $this->all();

        array_walk_recursive($data, function (&$value): void {
            if ($value === '') {
                $value = null;
            }
        });

        $this->merge([
            ...$data,
            'showprice' => (int) ($this->input('showprice') ?? 0),
            'promote_price' => (int) ($this->input('promote_price') ?? 0),
            'earlybird' => is_numeric($this->input('earlybird'))
                ? (int) $this->input('earlybird')
                : 0,
            'earlybird_note' => (string) ($this->input('earlybird_note') ?? ''),
            'currency' => (string) ($this->input('currency') ?? ''),
            'destination' => (string) ($this->input('destination') ?? ''),
            'name' => (string) ($this->input('name') ?? ''),
            'category_id' => $this->input('category_id') ?: null,
            'product_commission_category_id' => $this->input('product_commission_category_id') ?: null,
            'image_id' => $this->input('image_id') ?: null,
            'document_id' => $this->input('document_id') ?: null,
        ]);
    }
}
