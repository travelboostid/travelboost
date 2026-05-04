<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateBankAccountRequest extends FormRequest
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
   * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
   */
  public function rules(): array
  {
    return [
      'provider' => 'required|string|in:BCA,BNI,MANDIRI,OVO,GOPAY',
      'account_number' => 'required|string|max:50',
      'account_name' => 'required|string|max:100',
      'branch' => 'nullable|string|max:100',
      'is_default' => 'boolean',
    ];
  }

  public function messages(): array
  {
    return [
      'provider.required' => 'Provider is required',
      'provider.in' => 'Invalid provider selected',
      'account_number.required' => 'Account number is required',
      'account_name.required' => 'Account name is required',
    ];
  }
}
