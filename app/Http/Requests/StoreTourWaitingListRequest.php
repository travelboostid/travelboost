<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreTourWaitingListRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'schedules' => ['required', 'array', 'min:1', 'max:2'],
            'schedules.*.schedule_id' => ['required', 'integer', 'distinct'],
            'schedules.*.pax_adult' => ['required', 'integer', 'min:0', 'max:999'],
            'schedules.*.pax_child' => ['required', 'integer', 'min:0', 'max:999'],
            'schedules.*.pax_infant' => ['required', 'integer', 'min:0', 'max:999'],
            'schedules.*.accepts_partial_fulfillment' => ['required', 'boolean'],
            'schedules.*.minimum_partial_seats' => ['nullable', 'integer', 'min:1', 'max:999'],
            'schedules.*.is_priority' => ['required', 'boolean'],
            'contact_name' => ['required', 'string', 'max:255'],
            'contact_phone' => ['required', 'string', 'max:50'],
            'contact_email' => ['required', 'email', 'max:255'],
            'contact_address' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $schedules = collect($this->input('schedules', []));

            if ($schedules->isNotEmpty() && $schedules->where('is_priority', true)->count() !== 1) {
                $validator->errors()->add('schedules', 'Select exactly one priority schedule.');
            }

            $schedules->each(function (mixed $schedule, int $index) use ($validator): void {
                if (! is_array($schedule)) {
                    return;
                }

                $acceptsPartialFulfillment = filter_var(
                    $schedule['accepts_partial_fulfillment'] ?? null,
                    FILTER_VALIDATE_BOOLEAN,
                    FILTER_NULL_ON_FAILURE,
                );
                $minimumPartialSeats = $schedule['minimum_partial_seats'] ?? null;

                if ($acceptsPartialFulfillment === true && blank($minimumPartialSeats)) {
                    $validator->errors()->add(
                        "schedules.{$index}.minimum_partial_seats",
                        'Enter the minimum number of seat-using passengers that may still proceed.',
                    );
                }

                if ($acceptsPartialFulfillment === false && filled($minimumPartialSeats)) {
                    $validator->errors()->add(
                        "schedules.{$index}.minimum_partial_seats",
                        'Minimum partial seats is only allowed when partial fulfillment is accepted.',
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
            'schedules.*.schedule_id.distinct' => 'Each departure schedule may only be selected once.',
            'schedules.*.accepts_partial_fulfillment.required' => 'Please choose whether you accept partial seat fulfillment.',
        ];
    }
}
