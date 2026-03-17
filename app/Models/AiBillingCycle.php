<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiBillingCycle extends Model
{
  protected $fillable = [
    'company_id',
    'start_at',
    'end_at',
    'input_tokens',
    'output_tokens',
    'cost',
  ];

  protected function casts(): array
  {
    return [
      'start_at' => 'datetime',
      'end_at' => 'datetime',
      'input_tokens' => 'integer',
      'output_tokens' => 'integer',
      'cost' => 'decimal:8',
    ];
  }

  public function company(): BelongsTo
  {
    return $this->belongsTo(Company::class);
  }
}
