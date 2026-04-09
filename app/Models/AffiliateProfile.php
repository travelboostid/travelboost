<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AffiliateProfile extends Model
{
  use HasFactory;

  protected $fillable = [
    'user_id',
    'upline_id',
    'referral_code',
    'bank_name',
    'bank_account_name',
    'bank_account_number',
  ];

  // Relasi ke user pemilik profil
  public function user()
  {
    return $this->belongsTo(User::class);
  }

  // Relasi ke atasan (MA / Partner)
  public function upline()
  {
    return $this->belongsTo(User::class, 'upline_id');
  }
}
