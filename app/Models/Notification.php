<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Notification extends Model
{
  use HasFactory;

  protected $fillable = [
    'user_id',
    'type',
    'data',
    'read_at',
  ];

  protected $casts = [
    'data' => 'array',
    'read_at' => 'datetime',
  ];

  /* =====================
     |  Relationships
     ===================== */

  public function user()
  {
    return $this->belongsTo(User::class);
  }

  /* =====================
     |  Scopes
     ===================== */

  public function scopeUnread($query)
  {
    return $query->whereNull('read_at');
  }

  public function scopeRead($query)
  {
    return $query->whereNotNull('read_at');
  }

  /* =====================
     |  Helpers
     ===================== */

  public function markAsRead(): void
  {
    if ($this->read_at === null) {
      $this->update([
        'read_at' => now(),
      ]);
    }
  }

  public function isRead(): bool
  {
    return $this->read_at !== null;
  }
}
