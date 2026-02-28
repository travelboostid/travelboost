<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreChatMessageRequest extends FormRequest
{
  /**
   * Determine if the user is authorized to make this request.
   */
  public function authorize(): bool
  {
    return true; // add your auth logic if needed
  }

  /**
   * Get the validation rules that apply to the request.
   */
  public function rules(): array
  {
    return [
      'user_id' => 'nullable|exists:users,id',
      'sender_type' => 'nullable|string|max:50', // e.g., 'user', 'vendor', 'agent
      'sender_id' => 'nullable|integer', // ID of the sender type
      'message' => 'required|string|max:2000',
      'attachment' => 'nullable|string|max:2000', // max 10 MB
      'attachment_type' => 'nullable|string|max:50', // e.g., image, video, file
    ];
  }

  protected function prepareForValidation()
  {
    $this->merge([
      'sender_type' => $this->input('sender_type', 'user'),
      'sender_id'   => $this->input('sender_id', $this->user()->id),
      'user_id'     => $this->input('user_id', $this->user()->id),
    ]);
  }
}
