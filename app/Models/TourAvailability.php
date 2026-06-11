<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TourAvailability extends Model
{
    protected $table = 'tour_availabilities';

    protected $fillable = [
        'company_id',
        'tour_id',
        'schedule_id',
        'max_pax',
        'WP',
        'WPA',
        'DP',
        'FP',
        'RS',
        'manual_reserved_pending_value',
        'BRS',
        'WA',
        'CA',
        'RF',
        'EX',
        'WL',
        'available',
        'manual_reserved_started_at',
        'manual_reserved_expires_at',
        'manual_reserved_original_available',
    ];

    protected $casts = [
        'manual_reserved_started_at' => 'datetime',
        'manual_reserved_expires_at' => 'datetime',
        'manual_reserved_pending_value' => 'integer',
        'manual_reserved_original_available' => 'integer',
    ];

    public function tour()
    {
        return $this->belongsTo(Tour::class);
    }

    public function schedule()
    {
        return $this->belongsTo(TourSchedule::class, 'schedule_id');
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
