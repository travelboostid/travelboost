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
      'sender_type' => $this->sender_type,
      'sender_id' => $this->sender_id,
      'user_id' => $this->user_id,
      'message' => $this->message,
      'attachment' => $this->attachment,
      'attachment_type' => $this->attachment_type,
      'is_bot' => $this->is_bot,
      'reply_to' => $this->reply_to,
      'created_at' => $this->created_at,
      'updated_at' => $this->updated_at,

      // Relationships
      'sender' => $this->whenLoaded('sender', fn() => [
        'id' => $this->sender->id,
        'name' => $this->sender->name,
        'photo_url' => $this->sender->photo_url,
      ]),

      'room' => $this->whenLoaded('room', fn() => [
        'id' => $this->room->id,
        'name' => $this->room->name,
      ]),

      'replyTo' => $this->whenLoaded('replyTo', fn() => [
        'id' => $this->replyTo->id,
        'message' => $this->replyTo->message,
      ]),

      'replies_count' => $this->replies_count ?? $this->replies()->count(),
    ];
  }
}
