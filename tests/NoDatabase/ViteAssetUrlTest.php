<?php

use App\Support\ViteAssetUrl;
use Illuminate\Foundation\Vite;

test('vite asset urls resolve as same origin relative paths', function () {
    expect(ViteAssetUrl::resolve('build/assets/app.js'))
        ->toBe('/build/assets/app.js');
});

test('vite asset urls resolve css chunks as same origin relative paths', function () {
    expect(ViteAssetUrl::resolve('build/assets/app-CWzAEBxS.css'))
        ->toBe('/build/assets/app-CWzAEBxS.css');
});

test('vite asset urls preserve absolute urls', function () {
    expect(ViteAssetUrl::resolve('https://cdn.example.com/app.js'))
        ->toBe('https://cdn.example.com/app.js');
});

test('vite asset urls fall back to asset helper when hot file is empty', function () {
    config(['app.url' => 'https://dev.travelboost.co.id']);

    $hotFile = public_path('hot');
    $hadHot = is_file($hotFile);
    $original = $hadHot ? file_get_contents($hotFile) : null;

    file_put_contents($hotFile, "  \n  ");

    try {
        expect(ViteAssetUrl::resolve('build/assets/app.js'))
            ->toBe('https://dev.travelboost.co.id/build/assets/app.js');
    } finally {
        if ($hadHot) {
            file_put_contents($hotFile, $original);
        } else {
            @unlink($hotFile);
        }
    }
});

test('vite asset urls use hot server when vite dev server is running', function () {
    $hotFile = public_path('hot');
    $hadHot = is_file($hotFile);
    $original = $hadHot ? file_get_contents($hotFile) : null;

    file_put_contents($hotFile, 'http://localhost:5174');

    try {
        expect(ViteAssetUrl::resolve('build/assets/app.js'))
            ->toBe('http://localhost:5174/build/assets/app.js')
            ->not->toBe('/build/assets/app.js');
    } finally {
        if ($hadHot) {
            file_put_contents($hotFile, $original);
        } else {
            @unlink($hotFile);
        }
    }
});

test('vite service resolves assets without app url host', function () {
    config(['app.url' => 'https://dev.travelboost.co.id']);

    $vite = app(Vite::class);
    $assetPath = (new ReflectionMethod(Vite::class, 'assetPath'))
        ->invoke($vite, 'build/assets/app-abc123.js');

    expect($assetPath)
        ->toBe('/build/assets/app-abc123.js')
        ->not->toContain('dev.travelboost.co.id');
});
