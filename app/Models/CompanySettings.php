<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompanySettings extends Model
{
  protected $fillable = [
    'company_id',
    'enable_chatbot',
    'landing_page_data'
  ];

  public function company()
  {
    return $this->belongsTo(Company::class);
  }
}
