<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],
    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URL'),
        'ads' => [
            'developer_token' => env('GOOGLE_ADS_DEVELOPER_TOKEN'),
            'login_customer_id' => env('GOOGLE_ADS_LOGIN_CUSTOMER_ID'),
            'refresh_token' => env('GOOGLE_ADS_REFRESH_TOKEN'),
            'default_currency' => env('GOOGLE_ADS_DEFAULT_CURRENCY', 'IDR'),
            'default_timezone' => env('GOOGLE_ADS_DEFAULT_TIMEZONE', 'Asia/Jakarta'),
        ],
    ],

    'facebook' => [
        'client_id' => env('FACEBOOK_CLIENT_ID'),
        'client_secret' => env('FACEBOOK_CLIENT_SECRET'),
        'redirect' => env('FACEBOOK_REDIRECT_URL'),
        'ads' => [
            'business_id' => env('META_ADS_BUSINESS_ID'),
            'access_token' => env('META_ADS_ACCESS_TOKEN'),
            'page_id' => env('META_ADS_PAGE_ID'),
            'default_currency' => env('META_ADS_DEFAULT_CURRENCY', 'IDR'),
        ],
    ],

];
