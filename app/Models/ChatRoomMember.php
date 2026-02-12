<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;

class ChatRoomMember extends Model
{
  use HasFactory, Notifiable;

  protected $table = 'chat_room_members';

  protected $fillable = [
    'room_id',
    'user_id',
    'role',
    'joined_at',
    'last_read_at',
  ];

  public $timestamps = false; // karena pakai joined_at manual

  /* =====================
     |  Relationships
     ===================== */

  public function room()
  {
    return $this->belongsTo(ChatRoom::class, 'room_id');
  }

  public function user()
  {
    return $this->belongsTo(User::class);
  }
}
