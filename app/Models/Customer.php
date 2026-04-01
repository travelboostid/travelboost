<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Customer extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $table = 'customers';
    protected $fillable = [
        'company_id',
        'name',
        'username',
        'email',
        'password',
        'phone',
        'status',
        'meta',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'meta' => 'array',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id');
    }
}