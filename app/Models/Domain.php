<?php

namespace App\Models;

use App\Events\DomainUpdated;
use Illuminate\Database\Eloquent\Model;

class Domain extends Model
{
    protected $fillable = [
        'owner_type',
        'owner_id',
        'subdomain',
        'domain',
        'domain_enabled',
    ];

    protected $casts = [
        'domain_enabled' => 'boolean',
    ];

    protected static function booted()
    {

        static::updated(function ($domain) {
            if ($domain->wasChanged('domain') || $domain->wasChanged('domain_enabled')) {
                event(new DomainUpdated($domain));
            }
        });
    }

    public function owner()
    {
        return $this->morphTo();
    }
}
