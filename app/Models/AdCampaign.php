<?php

namespace App\Models;

use App\Enums\AdCampaignStatus;
use App\Enums\AdPlatform;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdCampaign extends Model
{
    protected $fillable = [
        'company_id',
        'ad_platform_connection_id',
        'platform',
        'status',
        'name',
        'external_campaign_id',
        'external_budget_id',
        'daily_budget',
        'final_url',
        'targeting',
        'creatives',
        'meta',
        'lifetime_spend',
        'paused_at',
        'ended_at',
    ];

    protected function casts(): array
    {
        return [
            'platform' => AdPlatform::class,
            'status' => AdCampaignStatus::class,
            'daily_budget' => 'decimal:2',
            'targeting' => 'array',
            'creatives' => 'array',
            'meta' => 'array',
            'lifetime_spend' => 'decimal:8',
            'paused_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function adPlatformConnection(): BelongsTo
    {
        return $this->belongsTo(AdPlatformConnection::class);
    }

    public function isActive(): bool
    {
        return $this->status === AdCampaignStatus::Active;
    }
}
