<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class TourCategory extends Model
{
  use HasFactory;

  protected $fillable = [
    'name',
    'description',
    'user_id',
  ];

  /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

  public function tours()
  {
    return $this->hasMany(Tour::class, 'category_id');
  }
  public function user()
  {
    return $this->belongsTo(User::class, 'user_id');
  }
}
