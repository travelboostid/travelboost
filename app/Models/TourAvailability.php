<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TourAvailability extends Model
{
    protected $table = 'tour_availabilities'; // 🔥 penting (karena plural tidak standar)

    protected $fillable = [
        'company_id',
        'tour_id',
        'schedule_id',
        'max_pax',
        'WP',
        'DP',
        'FP',
        'RS',
        'BRS',
        'WA',
        'CA',
        'RF',
        'EX',
        'WL',
        'available',
    ];

    public function schedule()
    {
        return $this->belongsTo(TourSchedule::class, 'schedule_id');
    }
}
