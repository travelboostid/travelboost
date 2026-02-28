<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;

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
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasPermissions;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements Customer, Wallet
{
  /** @use HasFactory<\Database\Factories\UserFactory> */
  use HasFactory, Notifiable, TwoFactorAuthenticatable, HasRoles, HasPermissions, CanPay, HasWallet, HasWallets, HasBankAccounts;

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
    'photo_id'
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

  public function preference()
  {
    return $this->hasOne(UserPreference::class);
  }

  public function companies()
  {
    return $this->belongsToMany(Company::class, 'company_members')
      ->withPivot('role')
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
}
