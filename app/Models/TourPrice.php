<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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

    public function priceCategory()
    {
        return $this->belongsTo(PriceCategory::class, 'price_category_id');
    }
}
