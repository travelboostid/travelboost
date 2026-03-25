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
        TourStatus::ACTIVE->value,
        TourStatus::INACTIVE->value
      ])],
      'continent_id'    => 'nullable|exists:continents,id',
      'region_id'       => 'nullable|exists:regions,id',
      'country_id'      => 'nullable|exists:countries,id',
      'destination'  => 'nullable|string|max:100',
      'category_id'  => 'nullable|exists:tour_categories,id',
      'parent_id'    => 'nullable|exists:tours,id',
      'user_id'      => 'nullable|exists:users,id',
      'image_id'  => 'nullable|exists:medias,id',
      'document_id'  => 'nullable|exists:medias,id',
      //'showprice' => 'nullable|integer|min:0',
      'showprice' => 'required|numeric|min:0',
      'promote_title' => 'nullable|string|max:255',
      'promote_note' => 'nullable|string|max:255',
      //'promote_price' => 'nullable|integer|min:0',
      'promote_price' => 'nullable|numeric|min:0',
    ];
  }

  protected function prepareForValidation()
  {
    // 1️⃣ Hapus field null
    $this->replace(
      array_filter($this->all(), fn($v) => !is_null($v))
    );

    // 2️⃣ Paksa harga jadi integer
    $this->merge([
        'showprice' => (int) ($this->showprice ?? 0),
        'promote_price' => (int) ($this->promote_price ?? 0),
    ]);
  }
}
