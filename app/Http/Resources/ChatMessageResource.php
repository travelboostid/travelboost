<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ChatMessageResource extends JsonResource
{
  /**
   * Transform the resource into an array.
   */
  public function toArray($request): array
  {
    return [
      'id' => $this->id,
      'room_id' => $this->room_id,
      'sender_id' => $this->sender_id,
      'message' => $this->message,
      'attachment' => $this->attachment,
      'attachment_type' => $this->attachment_type,
      'created_at' => $this->created_at,
      'updated_at' => $this->updated_at,

      // Relationships
      'sender' => $this->sender ? [
        'id' => $this->sender->id,
        'name' => $this->sender->name,
        'photo_url' => $this->sender->photo_url ?? null, // optional
      ] : null,

      'room' => $this->room ? [
        'id' => $this->room->id,
        'name' => $this->room->name,
      ] : null,

      'replyTo' => $this->replyTo ? [
        'id' => $this->replyTo->id,
        'message' => $this->replyTo->message,
        'user_id' => $this->replyTo->user_id,
      ] : null,

      'replies_count' => $this->replies()->count(),
    ];
  }
}
