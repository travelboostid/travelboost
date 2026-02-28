<?php

namespace App\Models;

use App\Enums\TourStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class AgentTour extends Model
{
  use HasFactory;

  protected $fillable = [
    'category_id',
    'tour_id',
    'company_id',
  ];

  protected $casts = [
    'status' => TourStatus::class,
  ];

  protected $with = [
    'tour',
    'company',
  ];

  public function company()
  {
    return $this->belongsTo(Company::class, 'company_id')->where('type', 'agent');
  }

  public function tour()
  {
    return $this->belongsTo(Tour::class, 'tour_id');
  }

  public function category()
  {
    return $this->belongsTo(TourCategory::class, 'category_id');
  }
}
