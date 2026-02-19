<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Region extends Model
{
  use HasFactory;

  protected $fillable = [
    'name',
    'continent_id',
  ];

  /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

  public function countries()
  {
    return $this->hasMany(Country::class, 'region_id');
  }
  public function continent()
  {
    return $this->belongsTo(Continent::class, 'continent_id');
  }
}
