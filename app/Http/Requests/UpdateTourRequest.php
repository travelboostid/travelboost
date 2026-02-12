<?php

namespace App\Http\Requests;

use App\Enums\TourStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class UpdateTourRequest extends FormRequest
{
  public function authorize(): bool
  {
    return Auth::check();
  }

  public function rules(): array
  {
    return [
      'name'         => 'nullable|string|max:255',
      'description'  => 'nullable|string',
      'duration_days' => 'nullable|integer|min:1',
      'status'       => ['required', Rule::in([
        TourStatus::Active->value,
        TourStatus::Inactive->value
      ])],
      'continent'    => 'nullable|string|max:100',
      'region'       => 'nullable|string|max:100',
      'country'      => 'nullable|string|max:100',
      'destination'  => 'nullable|string|max:100',
      'category_id'  => 'nullable|exists:tour_categories,id',
      'parent_id'    => 'nullable|exists:tours,id',
      'user_id'      => 'nullable|exists:users,id',
      'image_id'  => 'nullable|exists:medias,id',
      'document_id'  => 'nullable|exists:medias,id',
    ];
  }

  protected function prepareForValidation()
  {
    $this->replace(
      array_filter($this->all(), fn($v) => !is_null($v))
    );
  }
}
