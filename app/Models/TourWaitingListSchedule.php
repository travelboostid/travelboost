<?php

namespace App\Models;

use Database\Factories\TourWaitingListScheduleFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TourWaitingListSchedule extends Model
{
    /** @use HasFactory<TourWaitingListScheduleFactory> */
    use HasFactory;

    protected $fillable = [
        'tour_waiting_list_id',
        'tour_schedule_id',
        'preference_order',
        'available_seats_at_request',
        'display_price_at_request',
        'pax_adult',
        'pax_child',
        'pax_infant',
        'accepts_partial_fulfillment',
        'minimum_partial_seats',
        'is_priority',
    ];

    protected function casts(): array
    {
        return [
            'preference_order' => 'integer',
            'available_seats_at_request' => 'integer',
            'display_price_at_request' => 'decimal:2',
            'pax_adult' => 'integer',
            'pax_child' => 'integer',
            'pax_infant' => 'integer',
            'accepts_partial_fulfillment' => 'boolean',
            'minimum_partial_seats' => 'integer',
            'is_priority' => 'boolean',
        ];
    }

    public function waitingList(): BelongsTo
    {
        return $this->belongsTo(TourWaitingList::class, 'tour_waiting_list_id');
    }

    public function tourSchedule(): BelongsTo
    {
        return $this->belongsTo(TourSchedule::class);
    }
}
