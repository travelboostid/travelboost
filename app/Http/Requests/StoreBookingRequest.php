<?php

namespace App\Http\Requests;

use App\Enums\UserGender;
use App\Models\Tour;
use App\Services\BookingVisaTypeService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

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
            'booking_number' => [$this->routeIs('companies.dashboard.bookings.create.store') ? 'nullable' : 'required', 'string'],
            'tour_id' => ['required', 'exists:tours,id'],
            'departure_date' => ['required', 'date', 'after_or_equal:today'],
            'pax_adult' => ['required', 'integer', 'min:0'],
            'pax_child' => ['required', 'integer', 'min:0'],
            'pax_infant' => ['required', 'integer', 'min:0'],
            'vendor_id' => ['nullable', 'exists:companies,id'],
            'agent_id' => ['nullable', 'exists:companies,id'],

            // Contact info
            'contact_name' => ['required', 'string', 'max:255'],
            'contact_email' => ['required', 'email', 'max:255'],
            'contact_phone' => ['required', 'string', 'max:50'],
            'contact_notes' => ['nullable', 'string', 'max:1000'],
            'payment_type' => ['required', 'string', Rule::in(['down_payment', 'full_payment'])],
            'payment_method' => ['required', 'string', Rule::in(['manual_transfer', 'bank_transfer', 'midtrans', 'online'])],
            'payment_mode' => ['nullable', 'string', Rule::in(['manual', 'online'])],
            // Passengers
            'passengers' => ['required', 'array', 'min:1'],
            'passengers.*.client_guest_id' => ['nullable', 'string', 'max:255'],
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
            'passengers.*.passport_issue_date' => ['nullable', 'date'],
            'passengers.*.passport_expiry_date' => ['nullable', 'date'],
            'passengers.*.passport_file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'passengers.*.passport_file_path' => ['nullable', 'string'],
            'passengers.*.visa_number' => ['nullable', 'string', 'max:255'],
            'passengers.*.visa_file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'passengers.*.visa_file_path' => ['nullable', 'string'],
            'passengers.*.visa_category_item_id' => ['nullable', 'integer', 'exists:visa_category_items,id'],
            'passengers.*.price_category' => ['nullable', 'string', 'max:255'],
            'passengers.*.price_amount' => ['nullable', 'numeric'],
            'passengers.*.note' => ['nullable', 'string', 'max:1000'],

            // Rooms
            'rooms' => ['nullable', 'array'],
            'rooms.*.room_type' => ['required_with:rooms', 'string', 'max:255'],
            'rooms.*.room_label' => ['nullable', 'string', 'max:255'],
            'rooms.*.bed_layout' => ['nullable', 'array'],
            'rooms.*.bed_layout.*.bedType' => ['nullable', 'string', 'max:255'],
            'rooms.*.bed_layout.*.guestId' => ['nullable', 'string', 'max:255'],
            'rooms.*.bed_layout.*.position' => ['nullable', 'array'],

            // Addons
            'addons' => ['nullable', 'array'],
            'addons.*.name' => ['required_with:addons', 'string', 'max:255'],
            'addons.*.price' => ['required_with:addons', 'numeric', 'min:0'],
            'addons.*.qty' => ['nullable', 'integer', 'min:1', 'max:999'],
            'addons.*.is_taxable' => ['nullable', 'boolean'],

            // Expected totals from frontend
            'total_price' => ['required', 'numeric', 'min:0'],
            'tax_amount' => ['required', 'numeric', 'min:0'],
            'platform_fee' => ['required', 'numeric', 'min:0'],
            'commission_amount' => ['required', 'numeric', 'min:0'],
            'grand_total' => ['required', 'numeric', 'min:0'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $tour = Tour::query()
                ->with('visaCategory.items')
                ->find((int) $this->input('tour_id'));

            if (! $tour) {
                return;
            }

            $errors = app(BookingVisaTypeService::class)
                ->validationErrorsForPassengers($tour, (array) $this->input('passengers', []));

            foreach ($errors as $field => $message) {
                $validator->errors()->add($field, $message);
            }
        });
    }
}
