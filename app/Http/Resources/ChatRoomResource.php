<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ChatRoomResource extends JsonResource
{
  /**
   * Transform the resource into an array.
   */
  public function toArray($request): array
  {
    return [
      'id' => $this->id,
      'name' => $this->name,
      'type' => $this->type,

      'created_by' => $this->created_by,
      'created_at' => $this->created_at,
      'updated_at' => $this->updated_at,

      'creator' => $this->whenLoaded('creator', fn() => [
        'id' => $this->creator->id,
        'name' => $this->creator->name,
        'photo_url' => $this->creator->photo_url,
      ]),

      'last_message' => $this->whenLoaded('lastMessage', fn() => [
        'id' => $this->lastMessage->id,
        'message' => $this->lastMessage->message,
        'user_id' => $this->lastMessage->user_id,
        'created_at' => $this->lastMessage->created_at,
      ]),

      'members' => $this->whenLoaded(
        'members',
        fn() =>
        $this->members->map(fn($member) => [
          'id' => $member->id,
          'role' => $member->role ?? null,
          'joined_at' => $member->created_at,

          'user' => $member->relationLoaded('user') ? [
            'id' => $member->user->id,
            'name' => $member->user->name,
            'photo_url' => $member->user->photo_url,
          ] : null,
        ])
      ),
    ];
  }
}
