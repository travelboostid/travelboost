<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

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
    'photo_id',
    'identity_card_id'
  ];

  protected $appends = ['photo_url', 'identity_card_url'];

  public function user()
  {
    return $this->belongsTo(User::class);
  }

  public function upline()
  {
    return $this->belongsTo(User::class, 'upline_id');
  }

  public function downlines()
  {
    return $this->hasMany(AffiliateProfile::class, 'upline_id', 'user_id');
  }

  public function photo()
  {
    return $this->belongsTo(Media::class, 'photo_id');
  }

  public function identityCard()
  {
    return $this->belongsTo(Media::class, 'identity_card_id');
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

  public function identityCardUrl(): Attribute
  {
    return Attribute::make(
      get: function () {
        $files = collect($this->identityCard?->data['files'] ?? []);
        $file = $files->first(); // Mengambil resolusi gambar pertama
        return data_get($file, 'url');
      }
    );
  }
}
