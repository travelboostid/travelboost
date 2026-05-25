<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SearchResourceOwnersResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'users' => $this['users'] ?? [],
            'companies' => $this['companies'] ?? [],
            'affiliates' => $this['affiliates'] ?? [],
        ];
    }
}
