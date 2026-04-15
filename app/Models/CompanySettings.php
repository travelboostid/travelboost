<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CompanySettings extends Model
{
  use HasFactory;

  protected $fillable = [
    'chatbot_enabled',
    'chatbot_tone',
    'chatbot_emoji_usage',
    'chatbot_personality',
    'chatbot_default_language',
    'chatbot_model_code',
    'landing_page_data',
  ];

  protected $casts = [
    'chatbot_enabled' => 'boolean',
  ];

  public function company()
  {
    return $this->belongsTo(Company::class);
  }

  public function chatbotModel()
  {
    return $this->belongsTo(AiModel::class, 'chatbot_model_id');
  }
}
