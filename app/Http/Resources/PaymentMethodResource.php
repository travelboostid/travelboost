<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentMethodResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'provider' => $this->provider,
            'usage_scope' => $this->usage_scope instanceof \BackedEnum
                ? $this->usage_scope->value
                : $this->usage_scope,
            'method' => $this->method,
            'category' => $this->category instanceof \BackedEnum
                ? $this->category->value
                : $this->category,
            'meta' => $this->meta,
            'status' => $this->status instanceof \BackedEnum
                ? $this->status->value
                : $this->status,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
