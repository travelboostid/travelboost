<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiUsageLog extends Model
{
  protected $fillable = [
    'company_id',
    'model_id',
    'input_tokens',
    'output_tokens',
    'token_usage_cost',
    'user_cost',
    'feature',
    'meta',
  ];

  protected function casts(): array
  {
    return [
      'input_tokens' => 'integer',
      'output_tokens' => 'integer',
      'token_usage_cost' => 'decimal:16,8', // Updated precision
      'user_cost' => 'decimal:16,8', // Updated precision
      'meta' => 'array',
    ];
  }

  public function aiModel(): BelongsTo
  {
    return $this->belongsTo(AiModel::class, 'model_id');
  }

  public function company(): BelongsTo
  {
    return $this->belongsTo(Company::class);
  }
}
