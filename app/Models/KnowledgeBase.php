<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KnowledgeBase extends Model
{
  protected $fillable = [
    'owner_type',
    'owner_id',
    'content',
    'embedding',
  ];

  protected $casts = [
    'embedding' => 'array',
  ];

  public function owner()
  {
    return $this->morphTo();
  }
}
