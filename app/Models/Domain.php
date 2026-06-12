<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Domain extends Model
{
    protected $fillable = [
        'owner_type',
        'owner_id',
        'subdomain',
        'domain',
        'domain_enabled',
        'subdomain_enabled',
    ];

    protected $casts = [
        'domain_enabled' => 'boolean',
        'subdomain_enabled' => 'boolean',
    ];

    public function owner()
    {
        return $this->morphTo();
    }
}
