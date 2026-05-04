<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CompanySettings extends Model
{
  use HasFactory;

  protected $fillable = [
    'chatbot_enabled',
    'chatbot_response_style',
    'chatbot_default_language',
    'chatbot_model_code',
    'landing_page_data',
    'booking_deadline',
    'minimum_down_payment',
    'minimum_vat',
    'term_conditions',
    'booking_entry_time_limit',
    'manual_bank_transfer',
    'manual_bank_transfer_account_name',
    'manual_bank_transfer_account_number',
  ];

  protected $casts = [
    'chatbot_enabled' => 'boolean',
  ];

  public function company()
  {
    return $this->belongsTo(Company::class);
  }
}
