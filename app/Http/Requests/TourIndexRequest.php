<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TourIndexRequest extends FormRequest
{
  /**
   * Determine if the user is authorized to make this request.
   */
  public function authorize(): bool
  {
    // Allow public access to tour listings
    return true;
  }

  /**
   * Get the validation rules that apply to the request.
   */
  public function rules(): array
  {
    return [
      'company_id' => 'nullable|integer|exists:companies,id',
      'search' => 'nullable|string|max:100',
      'category_id' => 'nullable|integer|exists:tour_categories,id',
      'duration_min' => 'nullable|integer|min:1|max:365',
      'duration_max' => 'nullable|integer|min:1|max:365|gte:duration_min',
      'sort_by' => [
        'nullable',
        'string',
        Rule::in(['name', 'duration_days', 'created_at', 'updated_at'])
      ],
      'sort_order' => 'nullable|string|in:asc,desc',
      'per_page' => 'nullable|integer|min:1|max:100',
      'page' => 'nullable|integer|min:1',
    ];
  }

  /**
   * Prepare the data for validation.
   */
  protected function prepareForValidation()
  {
    // Set default values if not provided
    $this->merge([
      'per_page' => $this->input('per_page', 10),
      'page' => $this->input('page', 1),
      'sort_by' => $this->input('sort_by', 'created_at'),
      'sort_order' => $this->input('sort_order', 'desc'),
    ]);
  }
}
