<?php

$reverbHost = (string) env('REVERB_HOST', '');
$reverbScheme = (string) env('REVERB_SCHEME', 'https');
$isMidtransProduction = filter_var(env('MIDTRANS_IS_PRODUCTION', false), FILTER_VALIDATE_BOOL);

$midtransScriptHosts = $isMidtransProduction
    ? [
        'https://app.midtrans.com',
        'https://snap-assets.midtrans.com',
        'https://api.midtrans.com',
    ]
    : [
        'https://app.sandbox.midtrans.com',
        'https://snap-assets.sandbox.midtrans.com',
        'https://api.sandbox.midtrans.com',
    ];

$midtransConnectHosts = $midtransScriptHosts;

$reverbConnectSources = array_values(array_filter(array_unique([
    $reverbHost !== '' ? "{$reverbScheme}://{$reverbHost}" : null,
    $reverbHost !== '' ? "wss://{$reverbHost}" : null,
    $reverbHost !== '' ? "ws://{$reverbHost}" : null,
])));

return [
    'enabled' => filter_var(env('CSP_ENABLED', true), FILTER_VALIDATE_BOOL),

    'directives' => [
        'default-src' => ["'self'"],
        'base-uri' => ["'self'"],
        'form-action' => ["'self'"],
        'object-src' => ["'none'"],
        'frame-ancestors' => ["'self'"],
        'script-src' => array_merge(
            [
                "'self'",
                'https://www.googletagmanager.com',
                'https://pay.google.com',
                'https://gwk.gopayapi.com',
                // Midtrans Snap inline bootstrap script (sandbox + production builds).
                "'sha256-DueWcbxgRVJl6J5x2OBGlMjJ0RI9aTrwDoqaA4GHDhs='",
            ],
            $midtransScriptHosts,
        ),
        'style-src' => [
            "'self'",
            "'unsafe-inline'",
            'https://fonts.bunny.net',
        ],
        'font-src' => [
            "'self'",
            'data:',
            'https://fonts.bunny.net',
        ],
        'img-src' => [
            "'self'",
            'data:',
            'blob:',
            'https:',
        ],
        'connect-src' => array_merge(
            [
                "'self'",
                'https://www.google-analytics.com',
                'https://www.googletagmanager.com',
                'https://fonts.bunny.net',
            ],
            $midtransConnectHosts,
            $reverbConnectSources,
        ),
        'frame-src' => array_merge(
            ["'self'"],
            $midtransScriptHosts,
        ),
        'worker-src' => [
            "'self'",
            'blob:',
        ],
    ],
];
