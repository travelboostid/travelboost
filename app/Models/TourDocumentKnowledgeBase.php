<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TourDocumentKnowledgeBase extends Model
{
  protected $fillable = [
    'tour_id',
    'content',
    'embedding',
  ];

  public function tour()
  {
    return $this->belongsTo(Tour::class);
  }
}
