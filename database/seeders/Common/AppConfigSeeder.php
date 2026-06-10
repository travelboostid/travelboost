<?php

namespace Database\Seeders\Common;

use App\Models\AppConfig;
use Illuminate\Database\Seeder;

class AppConfigSeeder extends Seeder
{
    public function run(): void
    {
        /** @var list<string> $providers */
        $providers = config('openrouter-models.providers', ['openrouter']);

        /** @var list<string> $textModels */
        $textModels = config('openrouter-models.text_models', []);

        /** @var list<string> $embeddingModels */
        $embeddingModels = config('openrouter-models.embedding_models_1536', [
            'openai/text-embedding-3-small',
            'openai/text-embedding-ada-002',
        ]);

        AppConfig::updateOrCreate(
            ['key' => 'chatbot'],
            [
                'description' => 'Chatbot configuration',
                'schema' => [
                    'type' => 'object',
                    'title' => 'Chatbot configuration',
                    'description' => 'AI chatbot model selection and internal cost rates used for credit billing.',
                    'properties' => [
                        'chatbot_model_provider' => [
                            'type' => 'string',
                            'title' => 'Chatbot model provider',
                            'description' => 'AI provider used for chat completions.',
                            'enum' => $providers,
                            'default' => 'openrouter',
                        ],
                        'chatbot_model_name' => [
                            'type' => 'string',
                            'title' => 'Chatbot model name',
                            'description' => 'OpenRouter text model used for chat completions.',
                            'enum' => $textModels,
                        ],
                        'embedding_model_provider' => [
                            'type' => 'string',
                            'title' => 'Embedding model provider',
                            'description' => 'AI provider used when generating knowledge-base embeddings.',
                            'enum' => $providers,
                            'default' => 'openrouter',
                        ],
                        'embedding_model_name' => [
                            'type' => 'string',
                            'title' => 'Embedding model name',
                            'description' => 'OpenRouter embedding model with 1,536 dimensions (same vector size as openai/text-embedding-3-small). Warning: changing this on a live system can invalidate existing knowledge-base vectors and break semantic search until content is re-embedded.',
                            'enum' => $embeddingModels,
                        ],
                        'prompt_token_cost_per_million' => [
                            'type' => 'number',
                            'title' => 'Prompt token cost / million',
                            'description' => 'Internal IDR cost charged per 1,000,000 input tokens.',
                            'minimum' => 0,
                        ],
                        'completion_token_cost_per_million' => [
                            'type' => 'number',
                            'title' => 'Completion token cost / million',
                            'description' => 'Internal IDR cost charged per 1,000,000 output tokens.',
                            'minimum' => 0,
                        ],
                        'embedding_token_cost_per_million' => [
                            'type' => 'number',
                            'title' => 'Embedding token cost / million',
                            'description' => 'Internal IDR cost charged per 1,000,000 embedding tokens.',
                            'minimum' => 0,
                        ],
                        'user_cost_per_interaction' => [
                            'type' => 'number',
                            'title' => 'User cost per interaction',
                            'description' => 'Flat IDR amount deducted from company AI credit for each chatbot interaction.',
                            'minimum' => 0,
                        ],
                    ],
                    'required' => [
                        'chatbot_model_provider',
                        'chatbot_model_name',
                        'embedding_model_provider',
                        'embedding_model_name',
                        'prompt_token_cost_per_million',
                        'completion_token_cost_per_million',
                        'embedding_token_cost_per_million',
                        'user_cost_per_interaction',
                    ],
                ],
                'value' => [
                    'chatbot_model_provider' => 'openrouter',
                    'chatbot_model_name' => 'deepseek/deepseek-v4-flash',
                    'embedding_model_provider' => 'openrouter',
                    'embedding_model_name' => 'openai/text-embedding-3-small',
                    'prompt_token_cost_per_million' => 1800,
                    'completion_token_cost_per_million' => 2000,
                    'embedding_token_cost_per_million' => 400,
                    'user_cost_per_interaction' => 75,
                ],
            ]
        );

        AppConfig::updateOrCreate(
            ['key' => 'admin'],
            [
                'description' => 'Admin Parameter configuration',
                'schema' => [
                    'type' => 'object',
                    'title' => 'Admin parameters',
                    'description' => 'Platform-wide commercial rules for fees, commissions, and onboarding credits.',
                    'properties' => [
                        'platform_fee' => [
                            'type' => 'string',
                            'title' => 'Platform fee',
                            'description' => 'Flat IDR platform fee added to eligible bookings and settlements.',
                        ],
                        'commission_min' => [
                            'type' => 'string',
                            'title' => 'Commission minimum',
                            'description' => 'Minimum IDR commission amount applied in the lowest commission tier.',
                        ],
                        'commission_mid' => [
                            'type' => 'string',
                            'title' => 'Commission mid',
                            'description' => 'Default IDR commission amount used for the standard commission tier.',
                        ],
                        'commission_max' => [
                            'type' => 'string',
                            'title' => 'Commission maximum',
                            'description' => 'Maximum IDR commission amount used for the highest commission tier.',
                        ],
                        'free_ai_credit' => [
                            'type' => 'string',
                            'title' => 'Free AI credit',
                            'description' => 'Initial free AI credit balance granted to a new eligible account (IDR).',
                        ],
                        'free_ai_after_subscription' => [
                            'type' => 'string',
                            'title' => 'Free AI after subscription',
                            'description' => 'Bonus AI credit granted after an agent subscription is activated (IDR).',
                        ],
                        'affiliate_commission' => [
                            'type' => 'string',
                            'title' => 'Affiliate commission (%)',
                            'description' => 'Percentage share paid to a direct affiliate on qualifying transactions.',
                        ],
                        'ma_commission' => [
                            'type' => 'string',
                            'title' => 'Master affiliate commission (%)',
                            'description' => 'Percentage share paid to a master affiliate above regular affiliates.',
                        ],
                        'partner_commission' => [
                            'type' => 'string',
                            'title' => 'Partner commission (%)',
                            'description' => 'Percentage share paid to partner companies in the referral chain.',
                        ],
                        'wa_cs' => [
                            'type' => 'string',
                            'title' => 'WhatsApp customer service',
                            'description' => 'Public WhatsApp number shown to users for customer support contact.',
                        ],
                    ],
                    'required' => [
                        'platform_fee',
                        'commission_min',
                        'commission_mid',
                        'commission_max',
                        'free_ai_credit',
                        'free_ai_after_subscription',
                        'affiliate_commission',
                        'ma_commission',
                        'partner_commission',
                        'wa_cs',
                    ],
                ],
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
                'schema' => [
                    'type' => 'object',
                    'title' => 'Common configuration',
                    'description' => 'Shared public-site settings consumed across the application.',
                    'properties' => [
                        'google_analytics_measurement_id' => [
                            'type' => 'string',
                            'title' => 'Google Analytics measurement ID',
                            'description' => 'GA4 measurement ID (format G-XXXXXXXX) injected into public pages for analytics.',
                        ],
                    ],
                    'required' => [
                        'google_analytics_measurement_id',
                    ],
                ],
                'value' => [
                    'google_analytics_measurement_id' => 'G-M84B9HDRKQ',
                ],
            ]
        );
    }
}
