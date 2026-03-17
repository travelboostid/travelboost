<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;

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

class User extends Authenticatable implements Customer, Wallet, LaratrustUser
{
  /** @use HasFactory<\Database\Factories\UserFactory> */
  use HasFactory, Notifiable, TwoFactorAuthenticatable, HasRolesAndPermissions, CanPay, HasWallet, HasWallets, HasBankAccounts;

  /**
   * The attributes that are mass assignable.
   *
   * @var list<string>
   */
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
  ];

  /**
   * The attributes that should be hidden for serialization.
   *
   * @var list<string>
   */
  protected $hidden = [
    'password',
    'two_factor_secret',
    'two_factor_recovery_codes',
    'remember_token',
    'photo'
  ];

  /**
   * Get the attributes that should be cast.
   *
   * @return array<string, string>
   */
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

  // protected $with = ['photo'];

  // Relationship

  public function photo()
  {
    return $this->belongsTo(Media::class, 'photo_id');
  }

  public function bankAccounts()
  {
    return $this->hasMany(BankAccount::class);
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
}
