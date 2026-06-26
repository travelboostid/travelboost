<?php

namespace App\Models;

use App\Enums\VendorAgentPartnerStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VendorAgentPartner extends Model
{
    protected $fillable = [
        'vendor_id',
        'agent_id',
        'agent_tier_id',
        'status',
        'applied_at',
        'accepted_at',
        'note',
        'show_vendor_name',
        'payment_mode',
        'manual_payment_enabled',
        'online_payment_enabled',
        'agent_itinerary_upload_enabled',
    ];

    protected function casts(): array
    {
        return [
            'status' => VendorAgentPartnerStatus::class,
            'applied_at' => 'datetime',
            'accepted_at' => 'datetime',
            'show_vendor_name' => 'boolean',
            'manual_payment_enabled' => 'boolean',
            'online_payment_enabled' => 'boolean',
            'agent_itinerary_upload_enabled' => 'boolean',
        ];
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'vendor_id');
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'agent_id');
    }

    public function agentTier(): BelongsTo
    {
        return $this->belongsTo(AgentTier::class);
    }
}
