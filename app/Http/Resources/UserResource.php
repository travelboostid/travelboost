<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
  public function toArray(Request $request): array
  {
    return [
      'id' => $this->id,
      'name' => $this->name,
      'username' => $this->username,
      'email' => $this->email,
      'phone' => $this->phone,
      'address' => $this->address,
      'type' => $this->type,

      'photo_url' => $this->photo_url,

      'roles' => $this->whenLoaded(
        'roles',
        fn() =>
        $this->roles->pluck('name')
      ),

      'permissions' => $this->whenLoaded(
        'permissions',
        fn() =>
        $this->permissions->pluck('name')
      ),
      'created_at' => $this->created_at?->toISOString(),
    ];
  }
}
