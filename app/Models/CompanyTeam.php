<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Enums\CompanyTeamStatus;
use App\Events\CompanyTeamCreated;
use function PHPUnit\Framework\returnValue;

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

  protected $with = [
    'user',
    'user.roles',
  ];

  protected $appends = ['roles'];

  protected $dispatchesEvents = [
    'created' => CompanyTeamCreated::class
  ];

  /*
  |--------------------------------------------------------------------------
  | Relationships
  |--------------------------------------------------------------------------
  */

  public function company()
  {
    return $this->belongsTo(Company::class);
  }

  public function user()
  {
    return $this->belongsTo(User::class, 'user_id');
  }

  public function getRolesAttribute()
  {
    if ($this->user_id === null) {
      return Role::where('name', $this->invite_role)->get();
    }
    return $this->user->roles()->where('name', 'like', "company:{$this->company_id}:%")->get();
  }
}
