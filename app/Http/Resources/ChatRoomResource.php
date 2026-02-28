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
      'last_message' => $this->whenLoaded('lastMessage', fn() => [
        'id' => $this->lastMessage->id,
        'message' => $this->lastMessage->message,
        'user_id' => $this->lastMessage->user_id,
        'created_at' => $this->lastMessage->created_at,
        'is_bot' => $this->lastMessage->is_bot,
        'attachment' => $this->lastMessage->attachment,
        'attachment_type' => $this->lastMessage->attachment_type,
      ]),

      'members' => $this->whenLoaded('members')
    ];
  }
}
