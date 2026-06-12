<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GoogleAnalyticsConnection extends Model
{
    protected $fillable = [
        'company_google_account_id',
        'ga_account_id',
        'property_id',
        'data_stream_id',
        'measurement_id',
        'website_url',
        'timezone',
        'currency',
    ];

    public function googleAccount()
    {
        return $this->belongsTo(CompanyGoogleAccount::class, 'company_google_account_id');
    }

    public function company()
    {
        return $this->googleAccount->company;
    }
}
