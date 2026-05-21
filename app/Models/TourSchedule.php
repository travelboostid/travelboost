<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TourSchedule extends Model
{
    protected $fillable = [
        'tour_id',
        'tour_code',
        'company_id',
        'departure_date',
        'return_date',
        'quota',
        'cutoff_date',
        'is_active',
        'note',
    ];

    public function addOns()
    {
        return $this->hasMany(TourAddOn::class, 'schedule_id');
    }

    public function availability()
    {
        return $this->hasOne(TourAvailability::class, 'schedule_id');
    }

    public function prices()
    {
        return $this->hasMany(TourPrice::class, 'schedule_id')
            ->orderBy('id');
    }

    public function tour()
    {
        return $this->belongsTo(Tour::class, 'tour_id'); // ✅
    }
}
