<?php

namespace App\Models;

use App\Enums\MetaPixelConnectionSource;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MetaPixelConnection extends Model
{
    protected $fillable = [
        'company_id',
        'company_facebook_account_id',
        'pixel_id',
        'pixel_name',
        'ad_account_id',
        'connection_source',
        'website_url',
    ];

    protected $casts = [
        'connection_source' => MetaPixelConnectionSource::class,
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function facebookAccount(): BelongsTo
    {
        return $this->belongsTo(CompanyFacebookAccount::class, 'company_facebook_account_id');
    }
}
