<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;

class ChatMessage extends Model
{
  use HasFactory, Notifiable;

  protected $fillable = [
    'room_id',
    'sender_id',
    'message',
    'attachment',
    'attachment_type',
    'is_bot',
    'reply_to',
  ];

  /* =====================
     |  Relationships
     ===================== */

  public function room()
  {
    return $this->belongsTo(ChatRoom::class, 'room_id');
  }

  public function sender()
  {
    return $this->belongsTo(User::class, 'sender_id');
  }

  public function replyTo()
  {
    return $this->belongsTo(ChatMessage::class, 'reply_to');
  }

  public function replies()
  {
    return $this->hasMany(ChatMessage::class, 'reply_to');
  }
}
