<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTourCategoryRequest extends FormRequest
{
  public function rules(): array
  {
    return [
      'name' => ['nullable', 'string', 'max:255'],
      'description' => ['nullable', 'string'],
      'position_no' => ['nullable', 'string'],
    ];
  }

  protected function prepareForValidation()
  {
    $this->replace(
      array_filter($this->all(), fn($v) => !is_null($v))
    );
  }
}
