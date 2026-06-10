<?php

namespace App\Models;

use App\Enums\CompanyType;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AffiliateProfile extends Model
{
    protected $fillable = [
        'user_id',
        'upline_id',
        'tier',
        'status',
        'referral_code',
        'approved_at',
        'phone',
        'address',
        'province_id',
        'city_id',
        'district_id',
        'village_id',
        'postal_code',
        'identity_number',
        'photo_id',
        'identity_card_id',
    ];

    protected $appends = ['photo_url', 'identity_card_url'];

    protected static function booted(): void
    {
        static::creating(function (self $profile): void {
            if (blank($profile->referral_code) && $profile->user_id) {
                $user = $profile->relationLoaded('user') ? $profile->user : User::find($profile->user_id);

                if ($user) {
                    $profile->referral_code = $user->username ?: $user->email ?: 'affiliate-'.$user->id;
                }
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function upline()
    {
        return $this->belongsTo(User::class, 'upline_id');
    }

    public function downlines()
    {
        return $this->hasMany(AffiliateProfile::class, 'upline_id', 'user_id');
    }

    public function invitedAgents(): HasMany
    {
        return $this->hasMany(Company::class, 'referred_by', 'user_id')
            ->where('type', CompanyType::AGENT);
    }

    public function subscribedAgents(): HasMany
    {
        return $this->invitedAgents()
            ->whereHas('agentSubscription', fn ($query) => $query
                ->whereNotNull('started_at')
                ->whereNotNull('ended_at'));
    }

    public function photo()
    {
        return $this->belongsTo(Media::class, 'photo_id');
    }

    public function identityCard()
    {
        return $this->belongsTo(Media::class, 'identity_card_id');
    }

    public function photoUrl(): Attribute
    {
        return Attribute::make(
            get: function () {
                $files = collect($this->photo?->data['files'] ?? []);
                $file = $files->firstWhere('code', 'small');

                return data_get($file, 'url');
            }
        );
    }

    public function identityCardUrl(): Attribute
    {
        return Attribute::make(
            get: function () {
                $files = collect($this->identityCard?->data['files'] ?? []);
                $file = $files->first();

                return data_get($file, 'url');
            }
        );
    }
}
