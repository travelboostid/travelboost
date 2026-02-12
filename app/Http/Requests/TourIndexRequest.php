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
      'search' => 'nullable|string|max:100',
      'category_id' => [
        'nullable',
        'string',
        Rule::in(['beach', 'mountain', 'cultural', 'adventure', 'wildlife', 'historical', 'religious', 'culinary', 'cruise', 'safari'])
      ],
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
      'per_page' => $this->per_page ?? 10,
      'page' => $this->page ?? 1,
      'sort_by' => $this->sort_by ?? 'created_at',
      'sort_order' => $this->sort_order ?? 'desc',
      'available_only' => $this->boolean('available_only'),
      'featured' => $this->boolean('featured'),
    ]);
  }

  /**
   * Get validated data with defaults.
   */
  public function validatedData(): array
  {
    return array_merge([
      'per_page' => 10,
      'page' => 1,
      'sort_by' => 'created_at',
      'sort_order' => 'desc',
      'available_only' => false,
      'featured' => false,
    ], $this->validated());
  }
}
