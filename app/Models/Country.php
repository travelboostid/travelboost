<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Country extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'region_id',
        'continent_id',
    ];

    /*
      |--------------------------------------------------------------------------
      | Relationships
      |--------------------------------------------------------------------------
      */

    public function region()
    {
        return $this->belongsTo(Region::class, 'region_id');
    }

    public function continent()
    {
        return $this->belongsTo(Continent::class, 'continent_id');
    }
}
