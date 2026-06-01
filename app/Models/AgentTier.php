<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AgentTier extends Model
{
    protected $fillable = [
        'company_id',
        'name',
        'slug',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function partners(): HasMany
    {
        return $this->hasMany(VendorAgentPartner::class);
    }

    public function commissionRules(): HasMany
    {
        return $this->hasMany(TourCommissionRule::class);
    }
}
