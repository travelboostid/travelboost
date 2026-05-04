<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiCredit extends Model
{
  protected $fillable = [
    'company_id',
    'balance',
  ];

  protected function casts(): array
  {
    return [
      'balance' => 'decimal:8',
    ];
  }

  public function company(): BelongsTo
  {
    return $this->belongsTo(Company::class);
  }
}
