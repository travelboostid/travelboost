<?php

namespace App\Models;

use App\Enums\UserGender;
use App\Enums\UserStatus;
use App\Notifications\QueuedVerifyEmail;
use App\Traits\HasBankAccounts;
use Bavix\Wallet\Interfaces\Customer;
use Bavix\Wallet\Interfaces\Wallet;
use Bavix\Wallet\Traits\CanPay;
use Bavix\Wallet\Traits\HasWallet;
use Bavix\Wallet\Traits\HasWallets;
use Illuminate\Auth\MustVerifyEmail as MustVerifyEmailTrait;
use Illuminate\Contracts\Auth\MustVerifyEmail as MustVerifyEmailContract;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laratrust\Contracts\LaratrustUser;
use Laratrust\Traits\HasRolesAndPermissions;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable implements Customer, LaratrustUser, MustVerifyEmailContract, Wallet
{
    use CanPay, HasBankAccounts, HasFactory, HasWallet, HasWallets, MustVerifyEmailTrait, Notifiable, TwoFactorAuthenticatable;
    use HasRolesAndPermissions {
        isAbleTo as laratrustIsAbleTo;
    }

    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'phone',
        'address',
        'province_id',
        'city_id',
        'district_id',
        'village_id',
        'postal_code',
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

    protected static function booted(): void
    {
        static::created(function (self $user): void {
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

    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new QueuedVerifyEmail);
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

                return Media::normalizePublicUrl(data_get($file, 'url'));
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

    public function createdTourWaitingLists(): HasMany
    {
        return $this->hasMany(TourWaitingList::class, 'created_by_user_id');
    }

    public function customerTourWaitingLists(): HasMany
    {
        return $this->hasMany(TourWaitingList::class, 'customer_user_id');
    }

    public function tourLikes()
    {
        return $this->hasMany(TourLike::class);
    }

    public function likedTours()
    {
        return $this->belongsToMany(Tour::class, 'tour_likes')
            ->withTimestamps();
    }

    public function savedPassengers()
    {
        return $this->hasMany(SavedPassenger::class);
    }

    /**
     * Check if user has permissions, scoped to a company if a team is provided.
     *
     * @param  string|array|\BackedEnum  $permissions
     * @param  mixed  $team
     */
    public function isAbleTo($permissions, $team = null, bool $requireAll = false): bool
    {
        $companyId = null;

        if ($team !== null) {
            if ($team instanceof Company) {
                $companyId = $team->id;
            } elseif (is_string($team) && str_starts_with($team, 'company:')) {
                $companyId = (int) substr($team, 8);
            } elseif (is_numeric($team)) {
                $companyId = (int) $team;
            }
        }

        if ($companyId !== null) {
            if ($permissions instanceof \BackedEnum) {
                $permissions = $permissions->value;
            }

            $permissionsArray = is_array($permissions) ? $permissions : [$permissions];
            $permissionsArray = array_map(function ($perm) {
                return $perm instanceof \BackedEnum ? $perm->value : $perm;
            }, $permissionsArray);

            if ($requireAll) {
                foreach ($permissionsArray as $permission) {
                    $hasPermission = $this->roles()
                        ->where('name', 'like', "company:{$companyId}:%")
                        ->whereHas('permissions', function ($query) use ($permission) {
                            $query->where('name', $permission);
                        })
                        ->exists();

                    if (! $hasPermission) {
                        return false;
                    }
                }

                return true;
            }

            $hasPermission = $this->roles()
                ->where('name', 'like', "company:{$companyId}:%")
                ->whereHas('permissions', function ($query) use ($permissionsArray) {
                    $query->whereIn('name', $permissionsArray);
                })
                ->exists();

            if ($hasPermission) {
                return true;
            }

            return false;
        }

        return $this->laratrustIsAbleTo($permissions, $team, $requireAll);
    }
}
