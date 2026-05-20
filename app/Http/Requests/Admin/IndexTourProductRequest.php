<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class IndexTourProductRequest extends FormRequest
{

  public function prepareForValidation()
  {
    $this->merge([
      'company' => array_filter(explode(',', $this->input('company', ''))),
      'status' => array_filter(explode(',', $this->input('status', ''))),
      'sort' => $this->input('sort') ?? '-id',
      'page' => $this->input('page') ?? 1,
      'per_page' => $this->input('per_page') ?? 10,
    ]);
  }
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
      'code' => ['nullable', 'code'],
      'name' => ['nullable', 'string'],
      'company' => ['nullable', 'array'],
      'status' => ['nullable', 'array'],
      'created_at' => 'nullable|string|max:255',
      'sort' => [
        'nullable',
        'string',
        'max:255',
      ],
      'page' => 'nullable|integer|min:1',
      'per_page' => 'nullable|integer|min:1|max:100',
    ];
  }
}
