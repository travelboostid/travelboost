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
      'currency'  => 'nullable|string',

      //13042026
      'schedules' => 'nullable|array',

      'schedules.*.id' => ['nullable', 'integer'],

      'schedules.*.departure_date' => 'nullable|date',
      'schedules.*.return_date' => 'nullable|date',
      'schedules.*.quota' => 'nullable|numeric',

      'schedules.*.prices' => 'nullable|array',

      'schedules.*.prices.*.id' => 'nullable|integer',

      'schedules.*.prices.*.room_type_id' => 'nullable|integer',
      'schedules.*.prices.*.price' => 'nullable|numeric',

      'schedules.*.prices.*.promotion.type' => 'nullable|string',
      'schedules.*.prices.*.promotion.value' => 'nullable|numeric',

      'schedules.*.prices.*.commission.type' => 'nullable|string',
      'schedules.*.prices.*.commission.value' => 'nullable|numeric',
    ];
  }

  protected function prepareForValidation()
  {
    // 🔥 STEP 1: normalize empty string → null
    $data = $this->all();

    array_walk_recursive($data, function (&$value) {
        if ($value === '') {
            $value = null;
        }
    });

    $this->merge($data);

    // 🔥 STEP 2: baru ambil schedules yang sudah bersih
    $schedules = $this->input('schedules', []);

    $clean = collect($schedules)->map(function ($schedule) {
        return [
            ...$schedule,

            'departure_date' => $schedule['departure_date'] ?? null,
            'return_date' => $schedule['return_date'] ?? null,

            // 🔥 FIX quota kosong
            'quota' => is_numeric($schedule['quota'] ?? null)
                ? (int) $schedule['quota']
                : 0,

            'prices' => collect($schedule['prices'] ?? [])->map(function ($price) {

                return [
                    'id' => $price['id'] ?? null, 

                    'room_type_id' => is_numeric($price['room_type_id'] ?? null)
                        ? (int) $price['room_type_id']
                        : null,

                    'price' => is_numeric($price['price'] ?? null)
                        ? (int) $price['price']
                        : 0,

                    'promotion' => [
                        'type' => $price['promotion']['type'] ?? 'percent',
                        'value' => is_numeric($price['promotion']['value'] ?? null)
                            ? (float) $price['promotion']['value']
                            : 0,
                    ],

                    'commission' => [
                        'type' => $price['commission']['type'] ?? 'percent',
                        'value' => is_numeric($price['commission']['value'] ?? null)
                            ? (float) $price['commission']['value']
                            : 0,
                    ],
                ];
            })->values()->toArray(),
        ];
    })->values()->toArray();

    $this->merge([
        'showprice' => (int) ($this->showprice ?? 0),
        'promote_price' => (int) ($this->promote_price ?? 0),
        'schedules' => $clean,
    ]);

  }
}
