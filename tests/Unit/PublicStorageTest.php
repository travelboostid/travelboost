<?php

use App\Support\PublicStorage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('upload options include long-lived public cache control', function () {
    expect(PublicStorage::uploadOptions())->toBe([
        'visibility' => 'public',
        'CacheControl' => 'public, max-age=31536000, immutable',
    ]);
});

test('put applies cache control metadata on public disk', function () {
    Storage::fake('public');

    PublicStorage::put('images/test.txt', 'payload');

    Storage::disk('public')->assertExists('images/test.txt');
});

test('putFileAs applies cache control metadata on public disk', function () {
    Storage::fake('public');

    $path = PublicStorage::putFileAs(
        'media/documents',
        UploadedFile::fake()->create('proof.pdf', 32, 'application/pdf'),
        'proof.pdf',
    );

    expect($path)->toBe('media/documents/proof.pdf');
    Storage::disk('public')->assertExists('media/documents/proof.pdf');
});

test('s3 public disk defaults include cache control', function () {
    expect(config('filesystems.disks.s3.options.CacheControl'))
        ->toBe('public, max-age=31536000, immutable');
});
