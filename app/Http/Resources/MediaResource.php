<?php

namespace App\Http\Resources;

use App\Models\Media;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Media */
class MediaResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'type' => $this->type?->value ?? $this->type,
            'subtype' => $this->subtype,
            'owner_type' => $this->owner_type,
            'owner_id' => $this->owner_id,
            /**
             * Image payloads use `files[]`; documents/raw use `url`, `size`, `media_type`.
             *
             * @var array<string, mixed>|null
             */
            'data' => Media::normalizePublicUrlsInData($this->data),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'owner' => $this->whenLoaded('owner', fn () => [
                'id' => $this->owner?->id,
                'name' => $this->owner?->name ?? null,
            ]),
        ];
    }
}
