<?php

namespace App\Http\Requests\Admin;

use App\Enums\WithdrawalMethod;
use App\Enums\WithdrawalStatus;
use App\Models\Withdrawal;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateWithdrawalRequest extends FormRequest
{
    public function prepareForValidation() {}

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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Withdrawal $withdrawal */
        $withdrawal = $this->route('withdrawal');

        return [
            'method' => [
                'nullable',
                new Enum(WithdrawalMethod::class),
                function ($attribute, $value, $fail) use ($withdrawal) {
                    if ($withdrawal->status !== WithdrawalStatus::PENDING) {
                        $fail('Only pending withdrawal can update method.');
                    }
                },
            ],
            'status' => [
                'nullable',
                new Enum(WithdrawalStatus::class),
                function ($attribute, $value, $fail) use ($withdrawal) {
                    $method = $this->filled('method')
                      ? WithdrawalMethod::from($this->input('method'))
                      : $withdrawal->method;
                    $updateValue = WithdrawalStatus::from($value);

                    $current = $withdrawal->status;

                    $allowed =
                      match ($method) {
                          WithdrawalMethod::AUTO => (
                              ($current === WithdrawalStatus::PENDING && $updateValue === WithdrawalStatus::PROCESSING) ||
                              ($current === WithdrawalStatus::PENDING && $updateValue === WithdrawalStatus::REJECTED)
                          ),

                          WithdrawalMethod::MANUAL => (
                              ($current === WithdrawalStatus::PENDING && $updateValue === WithdrawalStatus::PROCESSING) ||
                              ($current === WithdrawalStatus::PENDING && $updateValue === WithdrawalStatus::REJECTED) ||
                              ($current === WithdrawalStatus::PROCESSING && $updateValue === WithdrawalStatus::PAID) ||
                              ($current === WithdrawalStatus::PROCESSING && $updateValue === WithdrawalStatus::REJECTED)
                          ),

                          default => false,
                      };

                    if (! $allowed) {
                        $fail('Invalid withdrawal status transition.');
                    }
                },
        ],
        ];
    }
}
