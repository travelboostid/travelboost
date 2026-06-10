<?php

namespace App\Http\Requests\Companies;

use App\Support\Rules\UserRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'username' => strtolower($this->input('username')),
            'email' => strtolower($this->input('email')),
        ]);
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => UserRules::name(),
            'username' => UserRules::username(),
            'email' => UserRules::email(),
            'password' => UserRules::password(),
        ];
    }
}
