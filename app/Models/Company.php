<?php

namespace App\Models;

use App\Enums\CompanyType;
use App\Traits\HasBankAccounts;
use Bavix\Wallet\Traits\CanPay;
use Bavix\Wallet\Traits\HasWallet;
use Bavix\Wallet\Traits\HasWallets;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Company extends Model
{
  use HasFactory, Notifiable, CanPay, HasWallet, HasWallets, HasBankAccounts;
  protected $fillable = [
    'name',
    'type',
    'username',
    'email',
    'address',
    'phone',
    'photo_id'
  ];

  protected $hidden = [
    'photo'
  ];

  protected $appends = ['photo_url'];

  protected static function booted()
  {
    static::created(function ($company) {

      $company->wallet()->create([
        'name' => 'Main Wallet',
        'slug' => 'main',
        'description' => 'Primary wallet for company transactions',
      ]);
      $company->settings()->create([
        'enable_chatbot' => false,
        'landing_page_data' => ''
      ]);
    });
  }

  public function members()
  {
    return $this->hasMany(CompanyMember::class);
  }

  public function invitations()
  {
    return $this->hasMany(CompanyMemberInvitation::class);
  }

  public function tours()
  {
    return $this->hasMany(Tour::class);
  }

  public function agentTours()
  {
    return $this->hasMany(AgentTour::class);
  }

  public function tourCategories()
  {
    return $this->hasMany(TourCategory::class);
  }

  public function settings()
  {
    return $this->hasOne(CompanySettings::class);
  }

  public function photo()
  {
    return $this->belongsTo(Media::class, 'photo_id');
  }

  public function medias()
  {
    return $this->morphMany(Media::class, 'owner');
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
}
