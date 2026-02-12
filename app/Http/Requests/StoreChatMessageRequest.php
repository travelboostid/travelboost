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
      'message' => 'required|string|max:2000',
      'attachment' => 'nullable|string|max:2000', // max 10 MB
      'attachment_type' => 'nullable|string|max:50', // e.g., image, video, file
      'reply_to' => 'nullable|exists:chat_messages,id', // optional reply
    ];
  }
}
