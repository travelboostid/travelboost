<?php

namespace App\Support;

class MediaCdn
{
    public static function preconnectOrigin(): ?string
    {
        $url = config('filesystems.disks.public.url')
            ?? config('filesystems.disks.s3.url');

        if (! is_string($url) || $url === '') {
            return null;
        }

        $parsed = parse_url($url);

        if (! is_array($parsed) || ! isset($parsed['scheme'], $parsed['host'])) {
            return null;
        }

        return $parsed['scheme'].'://'.$parsed['host'];
    }
}
