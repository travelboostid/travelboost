<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateCompanyTeamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $companyId = $this->route('company')?->id;
        $teamUserId = $this->route('team')?->user_id;

        return [
            'role' => [
                'sometimes',
                'string',
                'exists:roles,name',
                function (string $attribute, mixed $value, \Closure $fail) use ($companyId): void {
                    if (! is_string($value) || ! str_starts_with($value, "company:{$companyId}:")) {
                        $fail('The selected role is invalid.');
                    }
                },
            ],
            'status' => ['sometimes', 'string', 'in:active,suspended'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($teamUserId)],
            'password' => ['sometimes', 'confirmed', Password::defaults()],
        ];
    }
}
