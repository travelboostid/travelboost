<?php

namespace App\Models;

use App\Enums\TourStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Tour extends Model
{
  use HasFactory;

  protected $fillable = [
    'code',
    'name',
    'description',
    'duration_days',
    'status',
    'continent',
    'region',
    'country',
    'destination',
    'category_id',
    'parent_id',
    'user_id',
    'image_id',
    'document_id'
  ];

  protected $casts = [
    'status' => TourStatus::class,
  ];

  protected $with = [
    'image',
    'document',
    'category',
    'user'
  ];

  /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

  public function category()
  {
    return $this->belongsTo(TourCategory::class, 'category_id');
  }

  public function image()
  {
    return $this->belongsTo(Media::class, 'image_id');
  }

  public function document()
  {
    return $this->belongsTo(Media::class, 'document_id');
  }

  public function user()
  {
    return $this->belongsTo(User::class, 'user_id');
  }

  public function parent()
  {
    return $this->belongsTo(Tour::class, 'parent_id');
  }

  public function copies()
  {
    return $this->hasMany(Tour::class, 'parent_id');
  }

  /*
    |--------------------------------------------------------------------------
    | Query Scopes
    |--------------------------------------------------------------------------
    */

  public function scopeActive($query)
  {
    return $query->where('status', TourStatus::Active);
  }
}
