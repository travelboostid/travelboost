<?php

namespace App\Models;

use App\Events\ChatMessageCreated;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;

class ChatMessage extends Model
{
  use HasFactory, Notifiable;

  protected $fillable = [
    'room_id',
    'sender_type',
    'sender_id',
    'user_id',
    'message',
    'attachment_data',
    'attachment_type',
    'is_bot',
    'reply_to',
  ];

  protected $with = [
    'sender',
    'replyTo'
  ];

  protected $dispatchesEvents = [
    'created' => ChatMessageCreated::class,
  ];

  public function room()
  {
    return $this->belongsTo(ChatRoom::class, 'room_id');
  }

  public function sender()
  {
    return $this->morphTo();
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
