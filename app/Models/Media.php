<?php

namespace App\Models;

use App\Enums\MediaType;
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

    /**
     * Get the owner that owns the media
     */
    public function owner()
    {
        return $this->morphTo();
    }
}
