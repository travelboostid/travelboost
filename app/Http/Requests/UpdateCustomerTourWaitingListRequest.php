<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateCustomerTourWaitingListRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'schedules' => ['required', 'array', 'min:1', 'max:2'],
            'schedules.*.id' => ['required', 'integer'],
            'schedules.*.pax_adult' => ['required', 'integer', 'min:0', 'max:999'],
            'schedules.*.pax_child' => ['required', 'integer', 'min:0', 'max:999'],
            'schedules.*.pax_infant' => ['required', 'integer', 'min:0', 'max:999'],
            'contact_name' => ['required', 'string', 'max:255'],
            'contact_phone' => ['required', 'string', 'max:50'],
            'contact_email' => ['required', 'email', 'max:255'],
            'contact_address' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            collect($this->input('schedules', []))->each(function (mixed $schedule, int $index) use ($validator): void {
                if (! is_array($schedule)) {
                    return;
                }

                $requiredSeats = (int) ($schedule['pax_adult'] ?? 0) + (int) ($schedule['pax_child'] ?? 0);

                if ($requiredSeats < 1) {
                    $validator->errors()->add(
                        "schedules.{$index}.pax_adult",
                        'At least one adult or child seat is required.',
                    );
                }
            });
        });
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'schedules.max' => 'You may add a maximum of two departure schedules.',
        ];
    }
}
