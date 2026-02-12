<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PaymentIndexRequest extends FormRequest
{
  public function rules(): array
  {
    return [
      'status'    => 'sometimes|string|in:pending,paid,failed',
      'provider'  => 'sometimes|string|max:50',
      'from'      => 'sometimes|date',
      'to'        => 'sometimes|date',
      'per_page'  => 'sometimes|integer|min:1|max:100',
    ];
  }
}
