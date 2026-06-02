<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TourCommissionRule extends Model
{
    protected $fillable = [
        'tour_id',
        'agent_tier_id',
        'product_commission_category_id',
        'commission_type',
        'commission_value',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'commission_value' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function tour(): BelongsTo
    {
        return $this->belongsTo(Tour::class);
    }

    public function agentTier(): BelongsTo
    {
        return $this->belongsTo(AgentTier::class);
    }

    public function productCommissionCategory(): BelongsTo
    {
        return $this->belongsTo(ProductCommissionCategory::class);
    }

    public function scheduleAdjustments(): HasMany
    {
        return $this->hasMany(TourCommissionRuleScheduleAdjustment::class);
    }
}
