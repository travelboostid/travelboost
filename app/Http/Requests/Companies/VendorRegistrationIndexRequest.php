<?php

namespace App\Http\Requests\Companies;

use App\Enums\VendorAgentPartnerStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class VendorRegistrationIndexRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'status' => array_filter(explode(',', (string) $this->input('status', ''))),
            'payment_mode' => array_filter(explode(',', (string) $this->input('payment_mode', ''))),
            'sort' => $this->input('sort') ?? '-applied_at',
            'page' => $this->input('page') ?? 1,
            'per_page' => $this->input('per_page') ?? 10,
            'show_vendor_name' => $this->filled('show_vendor_name')
                ? $this->input('show_vendor_name') === '1'
                : null,
        ]);
    }

    /**
     * Determine if the user is authorized to make this request.
     */
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
            'vendor_name' => ['nullable', 'string', 'max:255'],
            'vendor_username' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'array'],
            'status.*' => ['string', Rule::enum(VendorAgentPartnerStatus::class)],
            'payment_mode' => ['nullable', 'array'],
            'payment_mode.*' => ['string', Rule::in(['vendor', 'agent'])],
            'show_vendor_name' => ['nullable', 'boolean'],
            'applied_at' => ['nullable', 'string', 'max:255'],
            'sort' => ['nullable', 'string', 'max:255'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
