<?php

namespace App\Http\Requests\Admin;

use App\Support\Rules\UserRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $user = $this->route('user');

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'username' => UserRules::username($user->tenant_id, $user->id),
            'email' => UserRules::email($user->tenant_id, $user->id),
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'gender' => ['sometimes', 'in:male,female,unspecified'],
            'status' => ['sometimes', 'in:active,inactive,suspended'],
            'note' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'photo_id' => ['sometimes', 'nullable', 'integer', 'exists:medias,id'],
            'roles' => ['sometimes', 'array'],
            'roles.*' => [
                'string',
                Rule::exists('roles', 'name')->where(
                    fn ($query) => $query->where('name', 'like', 'user:%')
                ),
            ],
        ];
    }
}
