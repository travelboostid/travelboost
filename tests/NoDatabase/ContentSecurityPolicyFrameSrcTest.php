<?php

use App\Support\ContentSecurityPolicy;
use App\Support\MediaCdn;

it('includes media storage origin in frame-src directive', function () {
    config()->set('filesystems.disks.public.url', 'https://nos.wjv-1.neo.id/tb-media-dev');

    $header = ContentSecurityPolicy::headerValue();

    expect($header)->toContain('frame-src')
        ->and($header)->toContain('https://nos.wjv-1.neo.id');
});

it('omits media storage origin from frame-src when media url is missing', function () {
    config()->set('filesystems.disks.public.url', null);
    config()->set('filesystems.disks.s3.url', null);

    expect(MediaCdn::preconnectOrigin())->toBeNull();

    $header = ContentSecurityPolicy::headerValue();

    expect($header)->toContain("frame-src 'self'")
        ->and($header)->not->toContain('https://nos.wjv-1.neo.id');
});
