<?php

namespace App\Http\Requests;

use App\Enums\MediaType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class MediaIndexRequest extends FormRequest
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
      'page' => ['sometimes', 'integer', 'min:1'],
      'page_size' => ['sometimes', 'integer', 'min:1', 'max:100'],
      'type' => ['sometimes', new Enum(MediaType::class)],
      'owner_id' => ['sometimes', 'integer', 'min:1'],
      'owner_type' => ['sometimes', 'string'],
    ];
  }
}
