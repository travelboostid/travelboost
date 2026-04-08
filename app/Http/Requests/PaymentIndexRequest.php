<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PaymentIndexRequest extends FormRequest
{
  public function rules(): array
  {
    return [
      'owner_type' => ['sometimes', 'string', 'in:user,company'],
      'owner_id' => [
        'sometimes',
        'integer',
        Rule::when($this->input('owner_type') === 'user', Rule::exists('users', 'id'), Rule::exists('companies', 'id'))
      ],
      'payable_type' => ['sometimes', 'string', 'max:50'],
      'status' => ['sometimes', 'string', 'in:pending,paid,failed'],
      'provider' => ['sometimes', 'string', 'max:50'],
      'from' => ['sometimes', 'date'],
      'to' => ['sometimes', 'date'],
      'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
    ];
  }
}
