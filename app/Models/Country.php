<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Country extends Model
{
  use HasFactory;

  protected $fillable = [
    'country',
    'region_id',
    'continent_id',
  ];

  /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

  public function countries()
  {
    return $this->hasMany(Tour::class, 'country');
  }
  public function region()
  {
    return $this->belongsTo(User::class, 'region_id');
  }
  public function continent()
  {
    return $this->belongsTo(User::class, 'continent_id');
  }
}
