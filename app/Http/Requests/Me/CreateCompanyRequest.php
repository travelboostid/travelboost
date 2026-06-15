<?php

namespace App\Http\Requests\Me;

use Illuminate\Contracts\Validation\ValidationRule;
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
        $username = strtolower((string) $this->input('username', ''));
        $subdomain = strtolower((string) $this->input('subdomain', $username));
        $email = strtolower((string) $this->input('email', ''));

        $this->merge([
            'username' => $username,
            'subdomain' => $subdomain ?: $username,
            'email' => $email,
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'username' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('companies', 'username'),
                Rule::unique('users', 'username')->ignore(auth()->id()),
            ],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('companies', 'email'),
                Rule::unique('users', 'email')->ignore(auth()->id()),
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
                'nullable',
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
