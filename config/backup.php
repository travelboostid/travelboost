<?php

return [

    'wal_g' => [
        'binary' => env('WALG_BINARY', '/usr/local/bin/wal-g'),
        's3_prefix' => env('WALG_S3_PREFIX'),
        'access_key_id' => env('WALG_ACCESS_KEY_ID'),
        'secret_access_key' => env('WALG_SECRET_ACCESS_KEY'),
        'endpoint' => env('WALG_ENDPOINT'),
        'region' => env('WALG_REGION', 'us-east-1'),
        'use_path_style' => env('WALG_USE_PATH_STYLE_ENDPOINT', true),
        'compression_method' => env('WALG_COMPRESSION_METHOD', 'zstd'),
        'retain_full' => (int) env('WALG_RETAIN_FULL', 7),
    ],

    'remote' => [
        'user' => env('DB_SSH_USER'),
        'host' => env('DB_SSH_HOST'),
        'backup_service' => env('WALG_BACKUP_SERVICE', 'wal-g-backup.service'),
        'backup_timer' => env('WALG_BACKUP_TIMER', 'wal-g-backup.timer'),
    ],

];
