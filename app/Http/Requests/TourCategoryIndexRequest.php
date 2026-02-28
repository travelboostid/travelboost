<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TourCategoryIndexRequest extends FormRequest
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
      'company_id' => ['nullable', 'integer'],
      'per_page'   => ['nullable', 'integer', 'min:1', 'max:100'],
      'page'       => ['nullable', 'integer', 'min:1'],
      'sort_by'    => ['nullable', 'string', 'in:name,created_at,updated_at'],
      'sort_order' => ['nullable', 'string', 'in:asc,desc'],
    ];
  }

  protected function prepareForValidation()
  {
    $this->merge([
      'per_page' => $this->per_page ?? 10,
      'page' => $this->page ?? 1,
      'sort_by' => $this->input('sort_by', 'created_at'),
      'sort_order' => $this->input('sort_order', 'desc'),
    ]);
  }
}
