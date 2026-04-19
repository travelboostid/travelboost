<?php

namespace App\Http\Requests\Companies;

use Illuminate\Foundation\Http\FormRequest;

class UpdateChatbotRequest extends FormRequest
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
      'chatbot_enabled' => 'sometimes|boolean',
      'chatbot_model_id' => 'sometimes|exists:ai_models,id',
      'chatbot_response_style' => 'sometimes|string|in:professional,friendly,casual',
      'chatbot_default_language' => 'sometimes|string|in:en,id,auto'
    ];
  }
}
