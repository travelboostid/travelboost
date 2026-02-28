<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CompanyIndexRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    return [
      'type'     => ['nullable', 'string', 'max:50'], // e.g., 'travel_agency', 'hotel', 'tour_operator'
      'search'   => ['nullable', 'string', 'max:100'],
      'page'     => ['nullable', 'integer', 'min:1'],
      'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
    ];
  }

  public function perPage(): int
  {
    return $this->integer('per_page', 15);
  }
}
