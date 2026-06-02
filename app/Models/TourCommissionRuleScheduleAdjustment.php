<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TourCommissionRuleScheduleAdjustment extends Model
{
    protected $fillable = [
        'tour_commission_rule_id',
        'tour_schedule_id',
        'commission_type',
        'commission_value',
    ];

    protected function casts(): array
    {
        return [
            'commission_value' => 'decimal:2',
        ];
    }

    public function rule(): BelongsTo
    {
        return $this->belongsTo(TourCommissionRule::class, 'tour_commission_rule_id');
    }

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(TourSchedule::class, 'tour_schedule_id');
    }
}
