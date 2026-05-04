<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ParameterTravelboost extends Model
{
  protected $fillable = [
    'category',
    'param_key',
    'param_label',
    'data_type',
    'number_value',
    'text_value',
    'is_active',
  ];

  protected $casts = [
    'is_active' => 'boolean',
    'number_value' => 'decimal:2',
  ];
}
