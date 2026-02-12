<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateChatMessageRequest extends FormRequest
{
  /**
   * Determine if the user is authorized to make this request.
   */
  public function authorize(): bool
  {
    return true; // implement auth logic if needed
  }

  /**
   * Get the validation rules that apply to the request.
   */
  public function rules(): array
  {
    return [
      'message' => 'sometimes|required|string|max:2000',
      'attachment' => 'nullable|string|max:2000',
      'attachment_type' => 'nullable|string|max:50',
    ];
  }

  protected function prepareForValidation()
  {
    $this->replace(
      array_filter($this->all(), fn($v) => !is_null($v))
    );
  }
}
