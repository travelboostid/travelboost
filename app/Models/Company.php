<?php

namespace App\Models;

use App\Enums\CompanyType;
use App\Traits\HasBankAccounts;
use Bavix\Wallet\Interfaces\Customer;
use Bavix\Wallet\Interfaces\Wallet;
use Bavix\Wallet\Traits\CanPay;
use Bavix\Wallet\Traits\HasWallet;
use Bavix\Wallet\Traits\HasWallets;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Notifications\Notifiable;

class Company extends Model implements Customer, Wallet
{
    use CanPay, HasBankAccounts, HasFactory, HasWallet, HasWallets, Notifiable;

    protected $fillable = [
        'name',
        'type',
        'username',
        'email',
        'address',
        'phone',
        'customer_service_phone',
        'photo_id',
        'meta',
        'note',
        'province_id',
        'city_id',
        'district_id',
        'village_id',
        'village_id',
        'postal_code',
        'identity_number',
        'identity_card_id',
    ];

    protected $hidden = [
        'photo',
    ];

    protected $casts = [
        'meta' => 'array',
        'type' => CompanyType::class,
    ];

    protected $appends = ['photo_url'];

    protected static function booted()
    {
        static::created(function ($company) {
            $company->wallet()->create([
                'name' => config('wallet.wallet.default.name'),
                'slug' => config('wallet.wallet.default.slug'),
                'description' => 'Primary wallet for company transactions',
            ]);
            $company->settings()->create(config('travelboost.company_default_settings'));

            // AI
            $company->aiCredit()->create([
                'balance' => 10000, // Default AI free credit balance for new companies
            ]);

            $roles = config('travelboost.company_default_roles', []);
            foreach ($roles as $role) {
                $newRole = Role::create([
                    'name' => "company:{$company->id}:{$role['name']}",
                    'display_name' => $role['display_name'],
                    'description' => $role['description'],
                ]);
                $newRole->givePermissions($role['permissions']);
            }
        });
    }

    public function teams()
    {
        return $this->hasMany(CompanyTeam::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'company_teams')
            ->withTimestamps();
    }

    public function tours()
    {
        return $this->hasMany(Tour::class);
    }

    public function agentTours()
    {
        // 31032026
        return $this->hasMany(AgentTour::class);
    }

    public function tourCategories()
    {
        return $this->hasMany(TourCategory::class);
    }

    public function agentTiers()
    {
        return $this->hasMany(AgentTier::class);
    }

    public function productCommissionCategories()
    {
        return $this->hasMany(ProductCommissionCategory::class);
    }

    public function visaCategories()
    {
        return $this->hasMany(VisaCategory::class);
    }

    public function tourCommissionRules()
    {
        return $this->hasMany(TourCommissionRule::class);
    }

    public function tourCommissionAdditionalRules()
    {
        return $this->hasMany(TourCommissionAdditionalRule::class);
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
        return $this->morphOne(Domain::class, 'owner');
    }

    public function agentPartners()
    {
        return $this->hasMany(VendorAgentPartner::class, 'vendor_id');
    }

    public function vendorPartners()
    {
        return $this->hasMany(VendorAgentPartner::class, 'agent_id');
    }

    public function aiCredit()
    {
        return $this->hasOne(AiCredit::class, 'company_id');
    }

    public function aiUsageLogs()
    {
        return $this->hasMany(AiUsageLog::class, 'company_id');
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

    public function referrer()
    {
        return $this->belongsTo(User::class, 'referred_by');
    }

    public function agentSubscription()
    {
        return $this->hasOne(AgentSubscription::class);
    }

    public function payments()
    {
        return $this->morphMany(Payment::class, 'owner');
    }

    public function identityCard()
    {
        return $this->belongsTo(Media::class, 'identity_card_id');
    }

    public function companySetting(): HasOne
    {
        return $this->hasOne(CompanySettings::class, 'company_id');
    }

    public function withdrawals()
    {
        return $this->morphMany(Withdrawal::class, 'owner');
    }

    public function googleAccount()
    {
        return $this->hasOne(CompanyGoogleAccount::class);
    }

    public function facebookAccount()
    {
        return $this->hasOne(CompanyFacebookAccount::class);
    }

    public function metaPixelConnection()
    {
        return $this->hasOne(MetaPixelConnection::class);
    }
}
