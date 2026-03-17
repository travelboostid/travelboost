<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiUsageLog extends Model
{
  protected $fillable = [
    'company_id',
    'model',
    'input_tokens',
    'output_tokens',
    'total_tokens',
    'cost',
    'feature',
    'meta',
    'billing_cycle_id', // Added billing_cycle_id
  ];

  protected function casts(): array
  {
    return [
      'input_tokens' => 'integer',
      'output_tokens' => 'integer',
      'total_tokens' => 'integer',
      'cost' => 'decimal:16,8', // Updated precision
      'meta' => 'array',
    ];
  }

  public function company(): BelongsTo
  {
    return $this->belongsTo(Company::class);
  }

  public function billingCycle(): BelongsTo // Added relationship for billing_cycle_id
  {
    return $this->belongsTo(AiBillingCycle::class);
  }
}
