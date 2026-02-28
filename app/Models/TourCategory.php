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
    'company_id',
  ];

  /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

  /**
   * Get the owner of the category (Vendor or Agent).
   */
  public function company()
  {
    return $this->belongsTo(Company::class, 'company_id');
  }

  /**
   * Optional: If you have tours under this category
   */
  public function tours()
  {
    return $this->hasMany(Tour::class);
  }

  public function agentTours()
  {
    return $this->hasMany(AgentTour::class);
  }
}
