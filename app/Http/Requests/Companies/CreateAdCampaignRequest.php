<?php

namespace App\Http\Requests\Companies;

use App\Enums\AdPlatform;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateAdCampaignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'platform' => ['required', Rule::in([AdPlatform::Google->value, AdPlatform::Meta->value])],
            'name' => ['required', 'string', 'max:255'],
            'final_url' => ['required', 'url', 'max:2048'],
            'daily_budget' => ['required', 'numeric', 'min:50000'],
            'headlines' => ['required', 'array', 'min:1', 'max:15'],
            'headlines.*' => ['required', 'string', 'max:30'],
            'descriptions' => ['required', 'array', 'min:1', 'max:4'],
            'descriptions.*' => ['required', 'string', 'max:90'],
        ];
    }
}
