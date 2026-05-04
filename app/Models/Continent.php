<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Continent extends Model
{
  use HasFactory;

  protected $fillable = [
    'name',
  ];

  public function countries()
  {
    return $this->hasMany(Country::class, 'continent_id');
  }
}
