<?php

namespace App\Http\Requests;

use App\Enums\BookingStatus;
use App\Enums\UserGender;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBookingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $booking = $this->route('booking');

        $fullEditStatuses = [
            BookingStatus::RESERVED,
            BookingStatus::BOOKING_RESERVED,
            BookingStatus::AWAITING_PAYMENT,
            BookingStatus::WAITING_PAYMENT_APPROVAL,
        ];

        if ($this->routeIs('companies.dashboard.bookings.update')) {
            return in_array($booking->status, $fullEditStatuses, true);
        }

        return in_array($booking->status, [
            ...$fullEditStatuses,
            BookingStatus::DOWN_PAYMENT,
            BookingStatus::FULL_PAYMENT,
        ], true);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $booking = $this->route('booking');

        return [
            'contact_name' => ['required', 'string', 'max:255'],
            'contact_email' => ['required', 'email', 'max:255'],
            'contact_phone' => ['required', 'string', 'max:50'],
            'contact_notes' => ['nullable', 'string', 'max:1000'],
            'pax_adult' => ['required', 'integer', 'min:1'],
            'pax_child' => ['required', 'integer', 'min:0'],
            'pax_infant' => ['required', 'integer', 'min:0'],
            'total_price' => ['required', 'numeric', 'min:0'],
            'tax_amount' => ['required', 'numeric', 'min:0'],
            'platform_fee' => ['required', 'numeric', 'min:0'],
            'commission_amount' => ['required', 'numeric', 'min:0'],
            'grand_total' => ['required', 'numeric', 'min:0'],

            'passengers' => ['required', 'array', 'min:1'],
            'passengers.*.id' => [
                'nullable',
                'integer',
                Rule::exists('booking_passengers', 'id')
                    ->where('booking_id', $booking?->id),
            ],
            'passengers.*.client_guest_id' => ['nullable', 'string', 'max:255'],
            'passengers.*.title' => ['nullable', 'string', 'max:20'],
            'passengers.*.first_name' => ['required', 'string', 'max:255'],
            'passengers.*.last_name' => ['nullable', 'string', 'max:255'],
            'passengers.*.gender' => ['nullable', Rule::enum(UserGender::class)],
            'passengers.*.dob' => ['nullable', 'date'],
            'passengers.*.pob' => ['nullable', 'string', 'max:255'],
            'passengers.*.nationality' => ['nullable', 'string', 'max:255'],
            'passengers.*.passport_number' => ['nullable', 'string', 'max:255'],
            'passengers.*.passport_issue_date' => ['nullable', 'date'],
            'passengers.*.passport_expiry_date' => ['nullable', 'date'],
            'passengers.*.visa_number' => ['nullable', 'string', 'max:255'],
            'passengers.*.price_category' => ['nullable', 'string', 'max:255'],
            'passengers.*.price_amount' => ['nullable', 'numeric'],
            'passengers.*.room_type' => ['nullable', 'string', 'max:255'],
            'passengers.*.room_number' => ['nullable', 'string', 'max:50'],
            'passengers.*.note' => ['nullable', 'string', 'max:1000'],

            'rooms' => ['nullable', 'array'],
            'rooms.*.room_type' => ['required_with:rooms', 'string', 'max:255'],
            'rooms.*.room_label' => ['nullable', 'string', 'max:255'],
            'rooms.*.bed_layout' => ['nullable', 'array'],
            'rooms.*.bed_layout.*.bedType' => ['nullable', 'string', 'max:255'],
            'rooms.*.bed_layout.*.guestId' => ['nullable', 'string', 'max:255'],
            'rooms.*.bed_layout.*.position' => ['nullable', 'array'],

            'addons' => ['nullable', 'array'],
            'addons.*.name' => ['required_with:addons', 'string', 'max:255'],
            'addons.*.price' => ['required_with:addons', 'numeric', 'min:0'],
            'addons.*.qty' => ['nullable', 'integer', 'min:1', 'max:999'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'passengers.*.first_name.required' => 'First name is required for each passenger.',
            'contact_name.required' => 'Contact name is required.',
            'contact_email.required' => 'Contact email is required.',
            'contact_phone.required' => 'Contact phone is required.',
        ];
    }
}
