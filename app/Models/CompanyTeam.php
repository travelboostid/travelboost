<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Enums\CompanyTeamRole;
use App\Enums\CompanyTeamStatus;

class CompanyTeam extends Model
{
  use HasFactory;

  protected $fillable = [
    'company_id',
    'user_id',
    'status',
    'role',
  ];

  protected $casts = [
    'status' => CompanyTeamStatus::class,
    'role'   => CompanyTeamRole::class,
  ];

  protected $with = [
    'user'
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
    return $this->belongsTo(User::class);
  }
}
