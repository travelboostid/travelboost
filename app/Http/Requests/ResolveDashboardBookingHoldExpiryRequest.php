<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ResolveDashboardBookingHoldExpiryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'resolution' => ['required', 'string', 'in:awaiting_payment,payment_in_progress'],
        ];
    }
}
