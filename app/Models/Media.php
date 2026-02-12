<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Enums\MediaType;

class Media extends Model
{
  protected $table = 'medias';

  protected $fillable = [
    'name',
    'description',
    'type',
    'data',
    'user_id',
    'created_at',
    'updated_at'
  ];

  protected $casts = [
    'type' => MediaType::class,
    'created_at' => 'datetime',
    'updated_at' => 'datetime',
    'data' => 'array'
  ];

  /**
   * Get the user that owns the media
   */
  public function user(): BelongsTo
  {
    return $this->belongsTo(User::class);
  }
}
