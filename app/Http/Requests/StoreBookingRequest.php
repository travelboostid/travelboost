<?php

namespace App\Http\Requests;

use App\Enums\UserGender;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBookingRequest extends FormRequest
{
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
            'tour_id' => ['required', 'exists:tours,id'],
            'departure_date' => ['required', 'date', 'after_or_equal:today'],
            'pax_adult' => ['required', 'integer', 'min:1'],
            'pax_child' => ['required', 'integer', 'min:0'],
            'pax_infant' => ['required', 'integer', 'min:0'],
            'vendor_id' => ['nullable', 'exists:companies,id'],
            'agent_id' => ['nullable', 'exists:companies,id'],

            // Passengers
            'passengers' => ['required', 'array', 'min:1'],
            'passengers.*.title' => ['nullable', 'string', 'max:20'],
            'passengers.*.first_name' => ['required', 'string', 'max:255'],
            'passengers.*.last_name' => ['nullable', 'string', 'max:255'],
            'passengers.*.gender' => ['nullable', Rule::enum(UserGender::class)],
            'passengers.*.dob' => ['nullable', 'date', 'before:today'],
            'passengers.*.pob' => ['required', 'string', 'max:255'],
            'passengers.*.room_type' => ['nullable', 'string', 'max:255'],
            'passengers.*.room_number' => ['nullable', 'string', 'max:50'],
            // Support for saving address book entries
            'passengers.*.save_to_address_book' => ['nullable', 'boolean'],
            'passengers.*.passport_number' => ['nullable', 'string', 'max:255'],
            'passengers.*.passport_file_path' => ['nullable', 'string'],
            'passengers.*.visa_file_path' => ['nullable', 'string'],

            // Addons
            'addons' => ['nullable', 'array'],
            'addons.*.name' => ['required_with:addons', 'string', 'max:255'],
            'addons.*.price' => ['required_with:addons', 'numeric', 'min:0'],

            // Expected totals from frontend
            'total_price' => ['required', 'numeric', 'min:0'],
            'tax_amount' => ['required', 'numeric', 'min:0'],
            'platform_fee' => ['required', 'numeric', 'min:0'],
            'commission_amount' => ['required', 'numeric', 'min:0'],
            'grand_total' => ['required', 'numeric', 'min:0'],
        ];
    }
}
