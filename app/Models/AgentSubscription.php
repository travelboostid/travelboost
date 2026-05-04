<?php

namespace App\Models;

use App\Enums\AgentSubscriptionStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class AgentSubscription extends Model
{
  protected $fillable = [
    'company_id',
    'package_id',
    'started_at',
    'ended_at',
  ];

  protected function casts(): array
  {
    return [
      'started_at' => 'datetime',
      'ended_at' => 'datetime',
    ];
  }

  protected $appends = [
    'status',
  ];

  /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

  public function company(): BelongsTo
  {
    return $this->belongsTo(Company::class);
  }

  public function package(): BelongsTo
  {
    return $this->belongsTo(AgentSubscriptionPackage::class);
  }

  /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

  public function getStatusAttribute()
  {
    $now = Carbon::now();

    if ($this->started_at === null || $this->ended_at === null) {
      return AgentSubscriptionStatus::INACTIVE;
    }

    if ($this->ended_at < $now) {
      return AgentSubscriptionStatus::EXPIRED;
    }

    return AgentSubscriptionStatus::ACTIVE;
  }
}
