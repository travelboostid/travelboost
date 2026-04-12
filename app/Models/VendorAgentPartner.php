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
    'status',
    'applied_at',
    'accepted_at',
    'note',
  ];

  protected function casts(): array
  {
    return [
      'status' => VendorAgentPartnerStatus::class,
      'applied_at' => 'datetime',
      'accepted_at' => 'datetime',
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
}
