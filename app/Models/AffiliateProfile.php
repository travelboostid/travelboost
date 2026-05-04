<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AffiliateProfile extends Model
{
  protected $fillable = [
    'user_id',
    'upline_id',
    'tier',
    'status',
    'referral_code',
    'approved_at',
    'phone',
    'address',
    'province',
    'city',
    'district',
    'village',
    'postal_code',
    'identity_number',
    'identity_photo_path',
    'profile_photo_path'
  ];

  // Relasi ke User (Pemilik profil)
  public function user()
  {
    return $this->belongsTo(User::class);
  }

  // Relasi ke Atasan (Partner/MA)
  public function upline()
  {
    return $this->belongsTo(User::class, 'upline_id');
  }

  // Relasi ke bawahan (Jika dia MA, maka ini daftar Affiliate-nya)
  public function downlines()
  {
    return $this->hasMany(AffiliateProfile::class, 'upline_id', 'user_id');
  }
}
