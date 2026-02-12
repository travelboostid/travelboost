<?php

namespace App\Http\Requests;

use App\Models\BankAccount;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class StoreBankAccountRequest extends FormRequest
{
  /**
   * Determine if the user is authorized to make this request.
   */
  public function authorize(): bool
  {
    return Auth::check();
  }

  /**
   * Get the validation rules that apply to the request.
   */
  public function rules(): array
  {
    return [
      'provider' => 'required|string|max:100',
      'account_number' => [
        'required',
        'string',
        'max:50',
        Rule::unique('bank_accounts')->where(function ($query) {
          return $query->where('user_id', Auth::id());
        })
      ],
      'account_name' => 'required|string|max:150',
      'branch' => 'nullable|string|max:100',
      'is_default' => 'boolean',
      'status' => 'nullable|in:' . implode(',', [
        BankAccount::STATUS_PENDING,
        BankAccount::STATUS_VERIFIED,
        BankAccount::STATUS_REJECTED
      ])
    ];
  }

  /**
   * Get custom messages for validator errors.
   */
  public function messages(): array
  {
    return [
      'account_number.unique' => 'You already have a bank account with this account number.',
      'provider.required' => 'Bank/Provider name is required.',
      'account_name.required' => 'Account holder name is required.',
      'status.in' => 'Status must be one of: pending, verified, rejected.'
    ];
  }

  /**
   * Prepare the data for validation.
   */
  protected function prepareForValidation(): void
  {
    $data = [];

    // Ensure is_default is boolean
    if ($this->has('is_default')) {
      $data['is_default'] = filter_var($this->is_default, FILTER_VALIDATE_BOOLEAN);
    }

    // Set default status if not provided
    if (!$this->has('status')) {
      $data['status'] = BankAccount::STATUS_PENDING;
    }

    // If setting as default, we'll handle it in the controller
    // This flag is for controller logic
    if ($this->has('is_default') && $this->is_default) {
      $data['set_as_default'] = true;
    }

    if (!empty($data)) {
      $this->merge($data);
    }
  }

  /**
   * Get the validated data from the request.
   */
  public function validated($key = null, $default = null): array
  {
    $validated = parent::validated($key, $default);

    // Add user_id to the validated data
    $validated['user_id'] = Auth::id();

    return $validated;
  }
}
