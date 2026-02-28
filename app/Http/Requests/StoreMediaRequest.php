<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMediaRequest extends FormRequest
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
      'owner_id' => ['required', 'integer', 'min:1'],
      'owner_type' => ['required', 'string'],
      'name' => ['nullable', 'string', 'max:255'],
      'description' => ['nullable', 'string'],
      'type' => ['required', 'in:image,photo,document'],
      'data' => ['required', 'file'],
    ];
  }
}
