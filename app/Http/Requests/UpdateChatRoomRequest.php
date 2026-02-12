<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateChatRoomRequest extends FormRequest
{
  /**
   * Determine if the user is authorized to make this request.
   */
  public function authorize(): bool
  {
    return true; // implement your auth logic if needed
  }

  /**
   * Get the validation rules that apply to the request.
   */
  public function rules(): array
  {
    return [
      'name' => 'sometimes|required|string|max:255', // allow partial updates
      'type' => 'nullable|in:group,private',
    ];
  }

  protected function prepareForValidation()
  {
    $this->replace(
      array_filter($this->all(), fn($v) => !is_null($v))
    );
  }
}
