<?php

namespace App\Models;

use App\Enums\MediaType;
use App\Events\MediaCreated;
use App\Events\MediaDeleting;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Media extends Model
{
    protected $table = 'medias';

    protected $fillable = [
        'owner_type',
        'owner_id',
        'name',
        'description',
        'type',
        'subtype',
        'data',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'type' => MediaType::class,
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'data' => 'array',
    ];

    protected $dispatchesEvents = [
        'created' => MediaCreated::class,
        'deleting' => MediaDeleting::class,
    ];

    /**
     * Get the owner that owns the media
     */
    public function owner()
    {
        return $this->morphTo();
    }

    public function knowledgeBase()
    {
        return $this->morphOne(KnowledgeBase::class, 'owner');
    }

    public function scopeWhereOwnerIn(
        Builder $query,
        array $owners
    ): Builder {
        $grouped = [];

        foreach ($owners as [$type, $id]) {
            $grouped[$type][] = $id;
        }

        return $query->where(function (Builder $query) use ($grouped) {
            foreach ($grouped as $type => $ids) {
                $query->orWhere(function (Builder $query) use ($type, $ids) {
                    $query
                        ->whereMorphedTo('owner', $type)
                        ->whereIn('owner_id', $ids);
                });
            }
        });
    }

    /** Storage key for Flysystem, e.g. `images/foo.webp` */
    public static function storageKey(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        $key = ltrim($path, '/');

        return $key !== '' ? $key : null;
    }

    /** Public path stored in media JSON, e.g. `/images/foo.webp` */
    public static function publicPath(string $storageKey): string
    {
        return '/'.ltrim($storageKey, '/');
    }

    public static function publicUrl(string $storageKey): string
    {
        $url = Storage::disk('public')->url($storageKey);

        return self::normalizePublicUrl($url);
    }

    public static function normalizePublicUrl(?string $url): ?string
    {
        if ($url === null || $url === '') {
            return $url;
        }

        $path = parse_url($url, PHP_URL_PATH);
        if (! is_string($path) || $path === '') {
            return $url;
        }

        $urlHost = parse_url($url, PHP_URL_HOST);
        if (! is_string($urlHost) || $urlHost === '') {
            return $url;
        }

        $appUrlHost = parse_url((string) config('app.url'), PHP_URL_HOST);
        $appHost = (string) config('app.host', 'localhost');
        $allowedHosts = array_filter([$appUrlHost, $appHost]);

        if (in_array($urlHost, $allowedHosts, true) && str_starts_with($path, '/storage/')) {
            return $path;
        }

        return $url;
    }

    /**
     * @param  array<string, mixed>|null  $data
     * @return array<string, mixed>|null
     */
    public static function normalizePublicUrlsInData(?array $data): ?array
    {
        if ($data === null) {
            return null;
        }

        if (isset($data['url']) && is_string($data['url'])) {
            $data['url'] = self::normalizePublicUrl($data['url']);
        }

        if (isset($data['files']) && is_array($data['files'])) {
            $data['files'] = array_map(function (mixed $file): mixed {
                if (! is_array($file)) {
                    return $file;
                }

                if (isset($file['url']) && is_string($file['url'])) {
                    $file['url'] = self::normalizePublicUrl($file['url']);
                }

                return $file;
            }, $data['files']);
        }

        return $data;
    }

    public static function storagePathFromUrl(?string $url): ?string
    {
        if ($url === null || $url === '') {
            return null;
        }

        $path = ltrim((string) parse_url($url, PHP_URL_PATH), '/');

        if ($path === '') {
            return null;
        }

        $bucket = (string) config('filesystems.disks.public.bucket');

        if ($bucket !== '' && str_starts_with($path, $bucket.'/')) {
            $path = substr($path, strlen($bucket) + 1);
        }

        if (str_starts_with($path, 'storage/')) {
            $path = substr($path, 8);
        }

        return $path !== '' ? $path : null;
    }
}
