<?php

namespace App\Http\Resources;

use App\Models\ImageMediaData;
use App\Models\MediaData;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Media */
class MediaResource extends JsonResource
{
  public function toArray(Request $request): array
  {
    return [
      'id' => $this->id,
      'name' => $this->name,
      'description' => $this->description,
      'type' => $this->type?->value ?? $this->type,
      /** @var ImageMediaData */
      'data' => $this->data,
      'user_id' => $this->user_id,
      'created_at' => $this->created_at?->toISOString(),
      'updated_at' => $this->updated_at?->toISOString(),

      // kalau perlu user info
      'user' => $this->whenLoaded('user', fn() => [
        'id' => $this->user->id,
        'name' => $this->user->name,
      ]),
    ];
  }
}
