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
                    'chatbot_model_provider' => 'openrouter',
                    'chatbot_model_name' => 'deepseek/deepseek-v4-flash',
                    'embedding_model_provider' => 'openrouter',
                    'embedding_model_name' => 'openai/text-embedding-3-small',
                    'prompt_token_cost_per_million' => '1800',
                    'completion_token_cost_per_million' => '2000',
                    'embedding_token_cost_per_million' => '400',
                    'user_cost_per_interaction' => '75',
                ],
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
                    'commission_max' => '75000',
                    'free_ai_credit' => '50000',
                    'free_ai_after_subscription' => '150000',
                    'affiliate_commission' => '15',
                    'ma_commission' => '10',
                    'partner_commission' => '5',
                    'wa_cs' => '+089662225982',
                ],
            ]
        );

        AppConfig::updateOrCreate(
            ['key' => 'common'],
            [
                'description' => 'Common configuration',
                'value' => [
                    'google_analytics_measurement_id' => 'G-M84B9HDRKQ',
                ],
            ]
        );
    }
}
