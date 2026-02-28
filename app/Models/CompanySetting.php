<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CompanySetting extends Model
{
  use HasFactory;

  protected $fillable = [
    'company_id',
    'enable_chatbot',
    'landing_page_data',
  ];

  protected $casts = [
    'enable_chatbot' => 'boolean',
  ];

  /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

  public function company()
  {
    return $this->belongsTo(Company::class);
  }
}
