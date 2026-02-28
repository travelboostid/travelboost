<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Enums\CompanyUserStatus;
use App\Enums\CompanyUserRole;

class CompanyMember extends Model
{
  use HasFactory;

  protected $fillable = [
    'company_id',
    'user_id',
    'status',
    'role',
  ];

  protected $casts = [
    'status' => CompanyUserStatus::class,
    'role'   => CompanyUserRole::class,
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
