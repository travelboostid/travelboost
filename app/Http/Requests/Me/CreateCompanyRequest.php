<?php

namespace App\Http\Requests\Me;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateCompanyRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'username' => strtolower($this->username),
            'subdomain' => strtolower($this->username),
            'email' => strtolower($this->email),
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'username' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('companies', 'username'),
            ],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('companies', 'email'),
            ],
            'subdomain' => [
                'required',
                'string',
                'max:255',
                Rule::unique('domains', 'subdomain'),
            ],
            'name' => [
                'required',
                'string',
                'max:255',
            ],
            'phone' => [
                'required',
                'string',
                'max:20',
            ],
            'customer_service_phone' => [
                'required',
                'string',
                'max:20',
            ],
            'address' => [
                'required',
                'string',
                'max:255',
            ],
            'photo_id' => [
                'required',
                'exists:medias,id',
            ],
            'province_id' => [
                'required',
                'exists:'.config('laravolt.indonesia.table_prefix').'provinces,id',
            ],
            'city_id' => [
                'required',
                'exists:'.config('laravolt.indonesia.table_prefix').'cities,id',
            ],
            'district_id' => [
                'required',
                'exists:'.config('laravolt.indonesia.table_prefix').'districts,id',
            ],
            'village_id' => [
                'required',
                'exists:'.config('laravolt.indonesia.table_prefix').'villages,id',
            ],
            'identity_card_id' => ['required', 'exists:medias,id'],
            'postal_code' => [
                'required',
                'string',
                'max:20', ],
            'identity_number' => 'required|string|size:16',
        ];
    }
}
