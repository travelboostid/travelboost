<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class WithdrawalIndexRequest extends FormRequest
{
  /**
   * Determine if the user is authorized to make this request.
   */
  public function authorize(): bool
  {
    // Adjust authorization logic based on your needs
    return Auth::check();
  }

  /**
   * Get the validation rules that apply to the request.
   */
  public function rules(): array
  {
    return [
      'status' => [
        'nullable',
        'string',
        Rule::in(['pending', 'processing', 'completed', 'failed', 'cancelled'])
      ],
      'payment_method' => 'nullable|string|max:50',
      'user_id' => 'nullable|integer|exists:users,id',
      'date_from' => 'nullable|date_format:Y-m-d',
      'date_to' => 'nullable|date_format:Y-m-d|after_or_equal:date_from',
      'amount_min' => 'nullable|numeric|min:0',
      'amount_max' => 'nullable|numeric|min:0|gt:amount_min',
      'sort_by' => 'nullable|string|in:created_at,amount,status,updated_at',
      'sort_order' => 'nullable|string|in:asc,desc',
      'per_page' => 'nullable|integer|min:1|max:100',
      'page' => 'nullable|integer|min:1',
    ];
  }

  /**
   * Get custom messages for validator errors.
   */
  public function messages(): array
  {
    return [
      'status.in' => 'Status must be one of: pending, processing, completed, failed, cancelled',
      'date_to.after_or_equal' => 'End date must be after or equal to start date',
      'amount_max.gt' => 'Maximum amount must be greater than minimum amount',
      'sort_by.in' => 'Sort by must be one of: created_at, amount, status, updated_at',
    ];
  }

  /**
   * Prepare the data for validation.
   */
  protected function prepareForValidation()
  {
    // Set default values if not provided
    $this->merge([
      'per_page' => $this->per_page ?? 15,
      'page' => $this->page ?? 1,
      'sort_by' => $this->sort_by ?? 'created_at',
      'sort_order' => $this->sort_order ?? 'desc',
    ]);
  }
}
