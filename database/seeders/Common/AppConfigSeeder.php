<?php

namespace Database\Seeders\Common;

use App\Models\AppConfig;
use Illuminate\Database\Seeder;

class AppConfigSeeder extends Seeder
{
  public function run(): void
  {
    AppConfig::updateOrCreate(
      ['key' => 'chatbot'],
      [
        'description' => 'Chatbot configuration',
        'value' => [
          'chatbot_model_provider' => 'mistral',
          'chatbot_model_name' => 'mistral-small-latest',
          'embedding_model_provider' => 'openai',
          'embedding_model_name' => 'text-embedding-3-small',
          'prompt_token_cost_per_million' => '1800',
          'completion_token_cost_per_million' => '5200',
          'embedding_token_cost_per_million' => '400',
          'user_cost_per_interaction' => '75',
        ]
      ]
    );

    AppConfig::updateOrCreate(
      ['key' => 'admin'],
      [
        'description' => 'Admin Parameter configuration',
        'value' => [
          'platform_fee' => '25000',
          'commission_min' => '50000',
          'commission_mid' => '75000',
          'commission_max' => '100000',
          'free_AI_credit' => '75',
          'affiliate_commission' => '15',
          'ma_commission' => '10',
          'partner_commission' => '5',
        ]
      ]
    );
  }
}