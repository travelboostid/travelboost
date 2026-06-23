<?php

/**
 * One-off script: generate WebP variants for home page images.
 * Run: php scripts/optimize-home-images.php
 */
$images = [
    'public/images/hero-travel.jpg',
    'public/images/travel-dashboard.jpg',
    'public/images/mobile-app.jpg',
    'public/images/travel-community.jpg',
    'public/images/logo/hori.png',
    'public/images/logo/hori-wt.png',
    'public/images/logo/partner/astindo.png',
    'public/images/logo/partner/prismalink.png',
    'public/images/logo/partner/gct.png',
    'public/images/stunning-tropical-beach-paradise.jpg',
];

$basePath = dirname(__DIR__);

foreach ($images as $relativePath) {
    $sourcePath = $basePath.'/'.$relativePath;

    if (! file_exists($sourcePath)) {
        echo "SKIP (missing): {$relativePath}\n";

        continue;
    }

    $webpPath = preg_replace('/\.(jpe?g|png)$/i', '.webp', $sourcePath);

    $imageInfo = getimagesize($sourcePath);
    $mime = $imageInfo['mime'] ?? null;

    $image = match ($mime) {
        'image/jpeg' => imagecreatefromjpeg($sourcePath),
        'image/png' => imagecreatefrompng($sourcePath),
        default => null,
    };

    if ($image === null) {
        echo "SKIP (unsupported): {$relativePath}\n";

        continue;
    }

    imagepalettetotruecolor($image);
    imagealphablending($image, true);
    imagesavealpha($image, true);

    $quality = str_contains($relativePath, 'logo') ? 85 : 80;
    imagewebp($image, $webpPath, $quality);

    $before = round(filesize($sourcePath) / 1024, 1);
    $after = round(filesize($webpPath) / 1024, 1);

    echo basename($relativePath).' → '.basename($webpPath)." ({$before}KB → {$after}KB)\n";
}
