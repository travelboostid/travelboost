<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OpenChatRequest extends FormRequest
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
      'recipient_type' => 'required|in:user,company',
      'recipient_id' => 'required|integer',
      'sender_type' => 'required|in:user,company',
      'sender_id' => 'required|integer',
    ];
  }
}
