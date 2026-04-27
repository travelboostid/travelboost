<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiUsageLog extends Model
{
  protected $fillable = [
    'company_id',
    'embedding_tokens',
    'prompt_tokens',
    'completion_tokens',
    'usage_cost',
    'user_cost',
    'feature',
    'meta',
  ];

  protected function casts(): array
  {
    return [
      'embedding_tokens' => 'integer',
      'prompt_tokens' => 'integer',
      'completion_tokens' => 'integer',
      'usage_cost' => 'decimal:16,8', // Updated precision
      'user_cost' => 'decimal:16,8', // Updated precision
      'meta' => 'array',
    ];
  }

  public function company(): BelongsTo
  {
    return $this->belongsTo(Company::class);
  }
}
