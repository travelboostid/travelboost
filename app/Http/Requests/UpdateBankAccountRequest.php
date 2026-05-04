<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateBankAccountRequest extends FormRequest
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
    $rules = [
      'provider' => 'sometimes|string|in:BCA,BNI,MANDIRI,OVO,GOPAY',
      'account_number' => 'sometimes|string|max:50',
      'account_name' => 'sometimes|string|max:100',
      'branch' => 'sometimes|nullable|string|max:100',
      'is_default' => 'sometimes|boolean',
    ];
    return $rules;
  }

  public function messages(): array
  {
    return [
      'provider.in' => 'Invalid provider selected',
      'status.in' => 'Invalid status selected',
    ];
  }
}
