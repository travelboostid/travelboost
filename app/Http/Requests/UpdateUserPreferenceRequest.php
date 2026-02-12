<?php

namespace App\Http\Requests;

use App\Models\UserPreference;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateUserPreferenceRequest extends FormRequest
{
  protected ?UserPreference $currentPreference = null;

  public function authorize(): bool
  {
    return Auth::check();
  }

  public function rules(): array
  {
    return [
      'meta_pixel_id' => 'nullable|string|max:100',
      'use_chatbot' => 'nullable|boolean',
      'landing_page_template_id' => 'nullable|string',
      'landing_page_template_data' => 'nullable|string',
    ];
  }

  protected function prepareForValidation()
  {
    $this->replace(
      array_filter($this->all(), fn($v) => !is_null($v))
    );
  }
}
