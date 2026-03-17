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
        'chatbot_enabled' => false,
        'chatbot_tone' => 'professional',
        'chatbot_emoji_usage' => 'minimal',
        'chatbot_personality' => 'assistant',
        'chatbot_default_language' => 'auto',
        'landing_page_data' => '',
      ]);

      // AI
      $company->aiCredit()->create([
        'balance' => 10, // Default AI free credit balance for new companies
      ]);

      // Access group and role setup
      $team = Team::create([
        'name' => "company:{$company->id}",
        'display_name' => "Company {$company->id} Team",
        'description' => "Default team for company {$company->id}",
      ]);
      $superadmin = Role::create([
        'name' => "company:{$company->id}:superadmin",
        'display_name' => "Superadmin",
        'description' => "Superadmin role with full permissions",
      ]);
      $superadmin->givePermissions([
        'user.create',
        'user.read',
        'user.update',
        'user.delete',

        'company.create',
        'company.read',
        'company.update',
        'company.delete',

        'wallet.create',
        'wallet.read',
        'wallet.update',
        'wallet.delete',

        'tour.create',
        'tour.read',
        'tour.update',
        'tour.delete',
      ]);

      $admin = Role::create([
        'name' => "company:{$company->id}:admin",
        'display_name' => "Admin",
        'description' => "Admin role with limited permissions",
      ]);
      $admin->givePermissions([
        'user.read',

        'company.read',

        'wallet.create',
        'wallet.read',
        'wallet.update',
        'wallet.delete',

        'tour.create',
        'tour.read',
        'tour.update',
        'tour.delete',
      ]);
    });
  }

  public function teams()
  {
    return $this->hasMany(CompanyTeam::class);
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
    return $this->hasOne(CompanySettings::class, 'company_id');
  }

  public function photo()
  {
    return $this->belongsTo(Media::class, 'photo_id');
  }

  public function medias()
  {
    return $this->morphMany(Media::class, 'owner');
  }

  public function customers()
  {
    return $this->hasMany(User::class);
  }

  public function domain()
  {
    return $this->hasOne(Domain::class);
  }

  public function agentPartners()
  {
    return $this->hasMany(VendorAgentPartner::class, 'vendor_id');
  }

  public function vendorPartners()
  {
    return $this->hasMany(VendorAgentPartner::class, 'agent_id');
  }

  protected function aiCredit()
  {
    return $this->hasOne(AiCredit::class, 'company_id');
  }

  protected function aiUsageLogs()
  {
    return $this->hasMany(AiUsageLog::class, 'company_id');
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
