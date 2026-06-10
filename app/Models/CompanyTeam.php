<?php

namespace App\Models;

use App\Enums\CompanyTeamStatus;
use App\Events\CompanyTeamCreated;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanyTeam extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'user_id',
        'invite_email',
        'invite_role',
        'invite_token',
        'invited_at',
        'is_owner',
        'accepted_at',
        'status',
    ];

    protected $casts = [
        'status' => CompanyTeamStatus::class,
        'invited_at' => 'datetime',
        'accepted_at' => 'datetime',
    ];

    // protected static function booted()
    // {
    //   static::created(function (CompanyTeam $team) {
    //     if ($team->user_id) {
    //       $team->user->addRole("company:{$team->company_id}:{$team->invite_role}", "company:{$team->company_id}");
    //     }
    //   });
    // }

    /** Eager load user and their roles */
    protected $with = [
        'user',
        'user.roles',
    ];

    /** Append computed roles attribute */
    protected $appends = ['roles'];

    protected $dispatchesEvents = [
        'created' => CompanyTeamCreated::class,
    ];

    /** @return BelongsTo */
    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    /** @return BelongsTo */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** Get roles for pending invites or accepted team members */
    public function getRolesAttribute()
    {
        if ($this->user_id === null) {
            return Role::where('name', $this->invite_role)->get();
        }

        return $this->user->roles()->where('name', 'like', "company:{$this->company_id}:%")->get();
    }
}
