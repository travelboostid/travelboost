<?php

namespace App\Http\Requests;

use App\Enums\MediaType;
use App\Models\Media;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class MediaIndexRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user->hasRole('user:admin')) {
            return true;
        }

        if ($this->filled('owner_type') && $this->filled('owner_id')) {
            return $user->can('viewOwnerMedia', [
                Media::class,
                $this->input('owner_type'),
                (int) $this->input('owner_id'),
            ]);
        }

        return false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'page' => ['sometimes', 'integer', 'min:1'],
            'page_size' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'type' => ['sometimes', new Enum(MediaType::class)],
            'subtype' => ['sometimes', 'string', 'max:50'],
            'owner_id' => ['sometimes', 'integer', 'min:1'],
            'owner_type' => ['sometimes', 'string'],
        ];
    }
}
