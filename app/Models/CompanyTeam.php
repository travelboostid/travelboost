<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Enums\CompanyTeamStatus;
use App\Events\CompanyTeamCreated;

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

  /** Eager load user and their roles */
  protected $with = [
    'user',
    'user.roles',
  ];

  /** Append computed roles attribute */
  protected $appends = ['roles'];

  protected $dispatchesEvents = [
    'created' => CompanyTeamCreated::class
  ];

  /** @return \Illuminate\Database\Eloquent\Relations\BelongsTo */
  public function company()
  {
    return $this->belongsTo(Company::class);
  }

  /** @return \Illuminate\Database\Eloquent\Relations\BelongsTo */
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
