<?php

return [
    'merchant_id' => env('PRISMALINK_MERCHANT_ID'),
    'merchant_key_id' => env('PRISMALINK_MERCHANT_KEY_ID'),
    'secret_key' => env('PRISMALINK_SECRET_KEY'),
    'is_production' => env('PRISMALINK_IS_PRODUCTION', false),
    'backend_callback_url' => env('PRISMALINK_BACKEND_CALLBACK_URL'),
    'frontend_callback_url' => env('PRISMALINK_FRONTEND_CALLBACK_URL'),
    'default_validity_hours' => env('PRISMALINK_DEFAULT_VALIDITY_HOURS', 24),
];
