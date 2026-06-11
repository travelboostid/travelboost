<?php

namespace App\Http\Requests;

use App\Models\Media;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreMediaRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        if (! $this->filled('owner_type') || ! $this->filled('owner_id')) {
            return false;
        }

        return $this->user()->can('createForOwner', [
            Media::class,
            $this->input('owner_type'),
            (int) $this->input('owner_id'),
        ]);
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'subtype' => $this->input('subtype', 'other'),
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
            'owner_id' => ['required', 'integer', 'min:1'],
            'owner_type' => ['required', 'string'],
            'name' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['required', 'in:image,document,raw'],
            'subtype' => ['required', 'string', 'max:50'],
            'data' => ['required', 'file'],
        ];
    }
}
