<?php

namespace App\Models;

use App\Ai\Agents\ChatbotAgent;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class AppConfig extends Model
{
    protected $fillable = [
        'key',
        'description',
        'schema',
        'value',
    ];

    protected $casts = [
        'schema' => 'array',
        'value' => 'array',
    ];

    protected static function booted(): void
    {
        static::saved(function (AppConfig $config): void {
            if ($config->key === 'chatbot') {
                Cache::forget(ChatbotAgent::CHATBOT_CONFIG_CACHE_KEY);
            }
        });

        static::deleted(function (AppConfig $config): void {
            if ($config->key === 'chatbot') {
                Cache::forget(ChatbotAgent::CHATBOT_CONFIG_CACHE_KEY);
            }
        });
    }
}
