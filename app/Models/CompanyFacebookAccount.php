<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class CompanyFacebookAccount extends Model
{
    protected $fillable = [
        'company_id',
        'facebook_id',
        'email',
        'name',
        'access_token',
        'refresh_token',
        'scopes',
        'expired_at',
    ];

    protected $casts = [
        'access_token' => 'encrypted',
        'refresh_token' => 'encrypted',
        'scopes' => 'array',
        'expired_at' => 'datetime',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function metaPixelConnection(): HasOne
    {
        return $this->hasOne(MetaPixelConnection::class);
    }
}
