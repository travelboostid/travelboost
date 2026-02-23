<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Region extends Model
{
  use HasFactory;

  protected $fillable = [
    'region',
    'continent_id',
  ];

  /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

  public function regions()
  {
    return $this->hasMany(Tour::class, 'region');
  }
  public function continent()
  {
    return $this->belongsTo(User::class, 'continent_id');
  }
}
