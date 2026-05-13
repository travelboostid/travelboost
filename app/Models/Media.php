<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Enums\MediaType;
use App\Events\MediaCreated;

class Media extends Model
{
  protected $table = 'medias';

  protected $fillable = [
    'owner_type',
    'owner_id',
    'name',
    'description',
    'type',
    'subtype',
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

  protected $dispatchesEvents = [
    'created' => MediaCreated::class,
  ];

  /**
   * Get the owner that owns the media
   */
  public function owner()
  {
    return $this->morphTo();
  }

  public function knowledgeBase()
  {
    return $this->morphOne(KnowledgeBase::class, 'owner');
  }
}
