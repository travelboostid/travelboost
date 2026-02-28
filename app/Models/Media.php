<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Enums\MediaType;

class Media extends Model
{
  protected $table = 'medias';

  protected $fillable = [
    'owner_type',
    'owner_id',
    'name',
    'description',
    'type',
    'data',
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
   * Get the owner that owns the media
   */
  public function owner()
  {
    return $this->morphTo();
  }
}
