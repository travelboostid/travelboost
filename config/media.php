<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Image variant definitions
    |--------------------------------------------------------------------------
    |
    | WebP quality values are tuned for catalog cards: slightly lower quality on
    | large/medium variants keeps CDN payloads smaller without visible loss at
    | typical card display sizes (~475px).
    |
    */

    'image_variants' => [
        'photo' => [
            ['code' => 'original', 'width' => 0, 'height' => 0, 'always_resized' => false, 'quality' => 85],
            ['code' => 'large', 'width' => 720, 'height' => 720, 'always_resized' => false, 'quality' => 82],
            ['code' => 'medium', 'width' => 480, 'height' => 480, 'always_resized' => false, 'quality' => 78],
            ['code' => 'small', 'width' => 320, 'height' => 320, 'always_resized' => true, 'quality' => 75],
            ['code' => 'thumb', 'width' => 240, 'height' => 240, 'always_resized' => true, 'quality' => 72],
        ],
        'image' => [
            ['code' => 'original', 'width' => 0, 'height' => 0, 'always_resized' => false, 'quality' => 80],
            ['code' => 'large', 'width' => 1080, 'height' => 0, 'always_resized' => false, 'quality' => 78],
            ['code' => 'medium', 'width' => 720, 'height' => 0, 'always_resized' => false, 'quality' => 72],
            ['code' => 'small', 'width' => 480, 'height' => 0, 'always_resized' => true, 'quality' => 72],
            ['code' => 'thumb', 'width' => 320, 'height' => 0, 'always_resized' => true, 'quality' => 70],
        ],
    ],

];
