<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AffiliateCommission extends Model
{
  use HasFactory;

  protected $fillable = [
    'user_id',
    'company_id',
    'amount',
    'tier',
    'status',
  ];

  // Relasi ke penerima komisi
  public function user()
  {
    return $this->belongsTo(User::class);
  }

  // Relasi ke sumber komisi (Agen)
  public function company()
  {
    return $this->belongsTo(Company::class);
  }
}
