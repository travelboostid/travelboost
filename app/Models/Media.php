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
}
