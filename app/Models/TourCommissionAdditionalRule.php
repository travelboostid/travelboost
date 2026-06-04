<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TourCommissionAdditionalRule extends Model
{
    protected $fillable = [
        'company_id',
        'agent_tier_id',
        'product_commission_category_id',
        'tour_id',
        'tour_schedule_id',
        'departure_date',
        'scope_type',
        'commission_type',
        'commission_value',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'departure_date' => 'date',
            'commission_value' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function agentTier(): BelongsTo
    {
        return $this->belongsTo(AgentTier::class);
    }

    public function productCommissionCategory(): BelongsTo
    {
        return $this->belongsTo(ProductCommissionCategory::class);
    }

    public function tour(): BelongsTo
    {
        return $this->belongsTo(Tour::class);
    }

    public function tourSchedule(): BelongsTo
    {
        return $this->belongsTo(TourSchedule::class);
    }
}
