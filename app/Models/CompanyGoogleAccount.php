<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompanyGoogleAccount extends Model
{
    protected $fillable = [
        'company_id',
        'google_id',
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

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function analyticsConnection()
    {
        return $this->hasOne(GoogleAnalyticsConnection::class);
    }
}
