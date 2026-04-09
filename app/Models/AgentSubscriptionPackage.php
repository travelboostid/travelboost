<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AgentSubscriptionPackage extends Model
{
  use HasFactory;

  protected $fillable = [
    'name',
    'duration_months',
    'price',
    'is_active',
  ];

  protected function casts(): array
  {
    return [
      'price' => 'decimal:2',
      'is_active' => 'boolean',
    ];
  }
}
