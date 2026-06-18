<?php

namespace App\Models;

use App\Enums\AdPlatform;
use App\Enums\AdPlatformConnectionStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class AdPlatformConnection extends Model
{
    protected $fillable = [
        'company_id',
        'platform',
        'status',
        'external_account_id',
        'external_account_name',
        'oauth_account_type',
        'oauth_account_id',
        'meta',
        'provisioned_at',
    ];

    protected function casts(): array
    {
        return [
            'platform' => AdPlatform::class,
            'status' => AdPlatformConnectionStatus::class,
            'meta' => 'array',
            'provisioned_at' => 'datetime',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function oauthAccount(): MorphTo
    {
        return $this->morphTo();
    }

    public function isReadyForCampaigns(): bool
    {
        return $this->status === AdPlatformConnectionStatus::Connected
            && filled($this->external_account_id);
    }
}
