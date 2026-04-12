<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiBillingCycle extends Model
{
  protected $fillable = [
    'company_id',
    'date',
    'input_tokens',
    'output_tokens',
    'cost',
    'charged_at',
  ];

  protected function casts(): array
  {
    return [
      'date' => 'date',
      'input_tokens' => 'integer',
      'output_tokens' => 'integer',
      'cost' => 'decimal:16',
      'charged_at' => 'datetime',
    ];
  }

  public function company(): BelongsTo
  {
    return $this->belongsTo(Company::class);
  }
}
