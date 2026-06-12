<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SearchResourceOwnersResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var array<string, mixed> $payload */
        $payload = $this->resource;

        return [
            /** @var list<UserResource> */
            'users' => $payload['users'],
            /** @var list<CompanyResource> */
            'companies' => $payload['companies'],
            /** @var list<AffiliateProfileResource> */
            'affiliates' => $payload['affiliates'],
        ];
    }
}
