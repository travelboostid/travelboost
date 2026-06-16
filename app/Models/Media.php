<?php

namespace App\Models;

use App\Enums\MediaType;
use App\Events\MediaCreated;
use App\Events\MediaDeleting;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

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
