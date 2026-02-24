<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CountryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
        'id'        => $this->id,
        'country'  => $this->country,
        'region_id' => $this->region_id,
        'continent_id'   => $this->continent_id,
    ];
    }
}
