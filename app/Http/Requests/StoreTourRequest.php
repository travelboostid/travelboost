<?php

namespace App\Http\Requests;

use App\Enums\TourStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StoreTourRequest extends FormRequest
{
  /**
   * Determine if the user is authorized to make this request.
   */
  public function authorize(): bool
  {
    return Auth::check();
  }

  /**
   * Get the validation rules that apply to the request.
   */
  public function rules(): array
  {
    return [
      'code'         => 'nullable|string|max:50|unique:tours,code',
      'name'         => 'required|string|max:255',
      'description'  => 'nullable|string',
      'duration_days' => 'nullable|integer|min:1',
      'status'       => ['nullable', Rule::in([
        TourStatus::Active->value,
        TourStatus::Inactive->value
      ])],
      'continent'    => 'nullable|string|max:100',
      'region'       => 'nullable|string|max:100',
      'country'      => 'nullable|string|max:100',
      'destination'  => 'nullable|string|max:100',
      'category_id'  => 'nullable|exists:tour_categories,id',
      'parent_id'    => 'nullable|exists:tours,id',
      'image_id'  => 'nullable|exists:medias,id',
      'document_id'  => 'nullable|exists:medias,id',
    ];
  }

  /**
   * Get custom messages for validator errors.
   */
  public function messages(): array
  {
    return [
      'code.unique' => 'This tour code is already in use.',
      // TODO: add more
    ];
  }

  /**
   * Get custom attributes for validator errors.
   */
  public function attributes(): array
  {
    return [
      'category_id' => 'category',
      // TODO: add more
    ];
  }

  /**
   * Prepare the data for validation.
   */
  protected function prepareForValidation(): void
  {
    $this->merge([
      'code' => $this->code ? Str::upper($this->code) : null,
      'duration_days' => $this->duration_days ?? 1,
      'continent' => $this->continent ?? "",
      'region' => $this->region ?? "",
      'country' => $this->country ?? "",
      'destination' => $this->destination ?? "",
      'user_id' => $this->user_id ?? Auth::id(),
      // TODO: add more
    ]);
  }

  /**
   * Handle a passed validation attempt.
   */
  protected function passedValidation(): void
  {
    // Generate tour code if not provided
    if (empty($this->code)) {
      $this->merge(['code' => $this->generateTourCode()]);
    }

    // Add authenticated user ID
    $this->merge(['user_id' => Auth::id()]);
  }

  /**
   * Generate a unique tour code.
   */
  private function generateTourCode(): string
  {
    $baseCode = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '-', $this->name), 0, 10));

    $counter = 1;
    $code = $baseCode . '-' . str_pad($counter, 3, '0', STR_PAD_LEFT);

    // Check for existing codes
    while (\App\Models\Tour::where('code', $code)->exists()) {
      $counter++;
      $code = $baseCode . '-' . str_pad($counter, 3, '0', STR_PAD_LEFT);
    }

    return $code;
  }
}
