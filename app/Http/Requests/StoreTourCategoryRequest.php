<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreTourCategoryRequest extends FormRequest
{
  public function authorize(): bool
  {
    // sudah login?
    return Auth::check();
  }

  public function rules(): array
  {
    return [
      'name' => ['required', 'string', 'max:255'],
      'description' => ['nullable', 'string'],
      'position_no' => ['required', 'string'],
    ];
  }

  public function attributes(): array
  {
    return [
      'name' => 'category name',
      'description' => 'description',
      'position_no' => 'position_no',
    ];
  }
}
