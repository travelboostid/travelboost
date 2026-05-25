<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppConfig extends Model
{
    protected $fillable = [
        'key',
        'description',
        'value',
    ];

    protected $casts = [
        'value' => 'array',
    ];
}
