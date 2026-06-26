<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class PublicStorage
{
    /**
     * @return array<string, mixed>
     */
    public static function uploadOptions(): array
    {
        return [
            'visibility' => 'public',
            'CacheControl' => 'public, max-age=31536000, immutable',
        ];
    }

    public static function put(string $path, mixed $contents, array $options = []): bool
    {
        return Storage::disk('public')->put(
            $path,
            $contents,
            [...self::uploadOptions(), ...$options],
        );
    }

    public static function putFileAs(
        string $directory,
        UploadedFile $file,
        string $name,
        array $options = [],
    ): string|false {
        return Storage::disk('public')->putFileAs(
            $directory,
            $file,
            $name,
            [...self::uploadOptions(), ...$options],
        );
    }
}
