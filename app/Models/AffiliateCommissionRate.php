<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AffiliateCommissionRate extends Model
{
  use HasFactory;

  // Izinkan kolom-kolom ini diisi secara massal (oleh Seeder)
  protected $fillable = [
    'tier',
    'percentage',
    'is_active',
  ];

  // Ubah tipe data percentage menjadi float/desimal saat ditarik dari DB
  protected $casts = [
    'percentage' => 'float',
    'is_active' => 'boolean',
  ];
}
