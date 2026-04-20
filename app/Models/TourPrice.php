<?php

namespace App\Models;

use App\Enums\TourStatus;
use App\Events\TourCreated;
use App\Events\TourUpdated;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class TourPrice extends Model
{
    protected $fillable = [
        'company_id',
        'tour_code',
        'schedule_id',
        'price_category_id',
        'currency',
        'price',
        'promotion_rate',
        'promotion',
        'commission_rate',
        'commission',
    ];

    public function tour()
    {
        return $this->belongsTo(Tour::class);
    }
}