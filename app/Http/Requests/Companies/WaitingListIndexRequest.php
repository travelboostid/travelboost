<?php

namespace App\Http\Requests\Companies;

use App\Enums\TourWaitingListStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class WaitingListIndexRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'status' => array_filter(explode(',', (string) $this->input('status', ''))),
            'source' => array_filter(explode(',', (string) $this->input('source', ''))),
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
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'tour_name' => ['nullable', 'string', 'max:255'],
            'tour_code' => ['nullable', 'string', 'max:255'],
            'contact_name' => ['nullable', 'string', 'max:255'],
            'contact_email' => ['nullable', 'string', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:255'],
            'vendor_name' => ['nullable', 'string', 'max:255'],
            'requester_name' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'array'],
            'status.*' => ['string', Rule::enum(TourWaitingListStatus::class)],
            'source' => ['nullable', 'array'],
            'source.*' => ['string', Rule::in(['dashboard', 'customer'])],
            'created_at' => ['nullable', 'string', 'max:255'],
            'sort' => ['nullable', 'string', 'max:255'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
