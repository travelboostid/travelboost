<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Continent extends Model
{
  use HasFactory;

  protected $fillable = [
    'continent',
    'user_id',
  ];

  /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

  public function tours()
  {
    return $this->hasMany(Tour::class, 'continent');
  }
  public function user()
  {
    return $this->belongsTo(User::class, 'user_id');
  }
}
