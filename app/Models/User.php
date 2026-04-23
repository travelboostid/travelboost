<?php

namespace App\Models;

use App\Enums\UserGender;
use App\Enums\UserStatus;
use App\Traits\HasBankAccounts;
use Bavix\Wallet\Interfaces\Customer;
use Bavix\Wallet\Interfaces\Wallet;
use Bavix\Wallet\Traits\CanPay;
use Bavix\Wallet\Traits\HasWallet;
use Bavix\Wallet\Traits\HasWallets;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laratrust\Contracts\LaratrustUser;
use Laratrust\Traits\HasRolesAndPermissions;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable implements Customer, LaratrustUser, Wallet
{
    use CanPay, HasBankAccounts, HasFactory, HasRolesAndPermissions, HasWallet, HasWallets, Notifiable, TwoFactorAuthenticatable;

    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'phone',
        'address',
        'photo_id',
        'company_id',
        'gender',
        'status',
        'meta',
        'note',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_recovery_codes',
        'two_factor_secret',
        'photo',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'status' => UserStatus::class,
            'gender' => UserGender::class,
        ];
    }

    protected $appends = ['photo_url'];

    protected $with = ['affiliateProfile', 'roles'];

    protected static function booted()
    {
        static::created(function ($user) {
            $user->wallet()->create([
                'name' => 'Main Wallet',
                'slug' => 'main',
                'description' => 'Primary wallet for user transactions',
            ]);
        });
    }

    public function photo()
    {
        return $this->belongsTo(Media::class, 'photo_id');
    }

    public function bankAccounts()
    {
        return $this->hasMany(BankAccount::class);
    }

    public function affiliateProfile()
    {
        return $this->hasOne(AffiliateProfile::class);
    }

    public function companies()
    {
        return $this->belongsToMany(Company::class, 'company_teams')
            ->withTimestamps();
    }

    protected function photoUrl(): Attribute
    {
        return Attribute::make(
            get: function () {
                $files = collect($this->photo?->data['files'] ?? []);
                $file = $files->firstWhere('code', 'small');

                return data_get($file, 'url');
            }
        );
    }

    public function medias()
    {
        return $this->morphMany(Media::class, 'owner');
    }

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function savedPassengers()
    {
        return $this->hasMany(SavedPassenger::class);
    }

    public function affiliateCommissionRates()
    {
        return $this->hasMany(AffiliateCommissionRate::class);
    }
}
