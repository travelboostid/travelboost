<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreAppConfigRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $value = $this->input('value');
        $schema = $this->input('schema');

        $this->merge([
            'value' => is_string($value)
                ? json_decode($value, true)
                : $value,
            'schema' => is_string($schema)
                ? json_decode($schema, true)
                : $schema,
        ]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'key' => 'required|string|unique:app_configs,key',
            'description' => 'nullable|string',
            'schema' => 'nullable|array',
            'value' => 'nullable|array',
        ];
    }
}
