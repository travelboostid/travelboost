<?php

namespace App\Http\Requests\Admin;

use App\Enums\WithdrawalStatus;
use App\Models\Withdrawal;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class UpdateWithdrawalRequest extends FormRequest
{

  public function prepareForValidation()
  {
    $this->merge([
      'sort' => $this->input('sort') ?? '-id',
      'page' => $this->input('page') ?? 1,
      'per_page' => $this->input('per_page') ?? 10,
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
   * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
   */
  public function rules(): array
  {
    /** @var Withdrawal $withdrawal */
    $withdrawal = $this->route('withdrawal');

    return [
      'status' => [
        'required',
        new Enum(WithdrawalStatus::class),
        function ($attribute, $value, $fail) use ($withdrawal) {
          $currentStatus = $withdrawal->status;

          // Only allow update to paid if current status is pending
          if ($value === WithdrawalStatus::PAID && $currentStatus !== WithdrawalStatus::PENDING) {
            $fail('Only pending withdrawal can be marked as paid.');
          }

          if ($value === WithdrawalStatus::REJECTED && $currentStatus !== WithdrawalStatus::PENDING) {
            $fail('Only pending withdrawal can be rejected.');
          }

          if ($value === WithdrawalStatus::CANCELLED && $currentStatus !== WithdrawalStatus::PENDING) {
            $fail('Only pending withdrawal can be cancelled.');
          }

          // Don't allow changing back to pending
          if ($value === WithdrawalStatus::PENDING && $currentStatus !== WithdrawalStatus::PENDING) {
            $fail('Cannot change status back to pending.');
          }
        },
      ],
    ];
  }
}
