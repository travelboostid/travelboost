<?php

namespace App\Models;

use App\Enums\DomainStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Domain extends Model
{
  protected $fillable = [
    'company_id',
    'domain',
    'status',
    'verification_token',
  ];

  protected $casts = [
    'status' => DomainStatus::class,
  ];

  public function company(): BelongsTo
  {
    return $this->belongsTo(Company::class);
  }
}
