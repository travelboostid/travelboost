<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;

class ChatRoom extends Model
{
  use HasFactory, Notifiable;

  protected $table = 'chat_rooms';

  protected $fillable = [
    'name',
    'type',
    'last_message_id',
    'created_by',
  ];

  /* =====================
     |  Relationships
     ===================== */

  // Creator of the room
  public function creator()
  {
    return $this->belongsTo(User::class, 'created_by');
  }

  // Messages in the room
  public function messages()
  {
    return $this->hasMany(ChatMessage::class, 'room_id');
  }

  public function lastMessage()
  {
    return $this->belongsTo(ChatMessage::class, 'last_message_id');
  }

  // Pivot records
  public function members()
  {
    return $this->hasMany(ChatRoomMember::class, 'room_id');
  }
}
