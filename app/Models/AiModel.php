<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiModel extends Model
{
  protected $fillable = [
    'code',
    'flat_rate',
    'input_token_rate',
    'output_token_rate',
  ];

  protected function casts(): array
  {
    return [
      'input_token_rate' => 'decimal:8',
      'output_token_rate' => 'decimal:8',
    ];
  }

  protected function aiUsageLogs()
  {
    return $this->hasMany(AiUsageLog::class, 'model_id');
  }
}
