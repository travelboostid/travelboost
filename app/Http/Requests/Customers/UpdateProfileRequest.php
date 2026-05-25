<?php

namespace App\Http\Requests\Customers;

use App\Enums\UserGender;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $user = $this->user();

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')
                    ->where('company_id', $user?->company_id)
                    ->ignore($user?->id),
            ],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
            'username' => [
                'required',
                'string',
                'max:255',
                Rule::unique('users', 'username')
                    ->where('company_id', $user?->company_id)
                    ->ignore($user?->id),
            ],
            'gender' => ['required', Rule::enum(UserGender::class)],
            'photo_id' => ['nullable', 'integer', 'exists:medias,id'],
            'province_id' => ['nullable', 'integer', 'exists:'.config('laravolt.indonesia.table_prefix').'provinces,id'],
            'city_id' => ['nullable', 'integer', 'exists:'.config('laravolt.indonesia.table_prefix').'cities,id'],
            'district_id' => ['nullable', 'integer', 'exists:'.config('laravolt.indonesia.table_prefix').'districts,id'],
            'village_id' => ['nullable', 'integer', 'exists:'.config('laravolt.indonesia.table_prefix').'villages,id'],
            'postal_code' => ['nullable', 'string', 'max:20'],
        ];
    }
}
