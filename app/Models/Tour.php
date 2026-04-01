<?php

namespace App\Models;

use App\Enums\TourStatus;
use App\Events\TourCreated;
use App\Events\TourUpdated;
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
    'continent_id',
    'region_id',
    'country_id',
    'destination',
    'category_id',
    'parent_id',
    'company_id',
    'image_id',
    'document_id',
    'showprice',
    'earlybird',
    'earlybird_note',
    'promote_title',
    'promote_price',
    'promote_note',
  ];

  protected $guarded = [
    'continent_name',
    'region_name',
    'country_name',
  ];

  protected $casts = [
    'status' => TourStatus::class,
  ];

  protected $with = [
    'image',
    'document',
    'category',
    'company',
  ];

  protected $dispatchesEvents = [
    'created' => TourCreated::class,
    'updated' => TourUpdated::class,
  ];

  protected static function booted()
  {
    static::saving(function ($tour) {

      if ($tour->isDirty('continent_id')) {
        $tour->continent_name = optional($tour->continent)->name;
      }

      if ($tour->isDirty('region_id')) {
        $tour->region_name = optional($tour->region)->name;
      }

      if ($tour->isDirty('country_id')) {
        $tour->country_name = optional($tour->country)->name;
      }
    });
  }

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

  public function company()
  {
    return $this->belongsTo(Company::class, 'company_id');
  }

  public function parent()
  {
    return $this->belongsTo(Tour::class, 'parent_id');
  }

  public function copies()
  {
    return $this->hasMany(Tour::class, 'parent_id');
  }

  public function continent()
  {
    return $this->belongsTo(Continent::class, 'continent_id');
  }

  public function region()
  {
    return $this->belongsTo(Region::class, 'region_id');
  }

  public function country()
  {
    return $this->belongsTo(Country::class, 'country_id');
  }

  //27032026
  public function schedules()
  {
      return $this->hasMany(TourSchedule::class);
  }

  //01042026
  public function agents()
  {
      return $this->belongsToMany(
          Company::class,
          'agent_tours',   // nama pivot table
          'tour_id',       // foreign key di pivot ke tour
          'company_id'     // foreign key di pivot ke company
      );
  }
  
}
