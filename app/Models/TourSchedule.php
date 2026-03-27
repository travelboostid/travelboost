<?php

namespace App\Models;

use App\Enums\TourStatus;
use App\Events\TourCreated;
use App\Events\TourUpdated;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class TourSchedule extends Model
{
    protected $fillable = [
        'tour_id',
        'departure_date',
        'return_date',
        'quota',
        'price',
        'agent_price',
        'cutoff_date',
        'is_active',
        'note',
    ];

    public function tour()
    {
        return $this->belongsTo(Tour::class);
    }
}