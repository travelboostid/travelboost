<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Enums\CompanyUserRole;

class CompanyMemberInvitation extends Model
{
  use HasFactory;

  protected $fillable = [
    'company_id',
    'user_id',
    'email',
    'role',
  ];

  protected $casts = [
    'role' => CompanyUserRole::class,
  ];

  protected $with = ['user'];

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
