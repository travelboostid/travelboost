<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VisaCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'name',
        'slug',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function items()
    {
        return $this->hasMany(VisaCategoryItem::class)->orderBy('sort_order')->orderBy('id');
    }

    public function tours()
    {
        return $this->hasMany(Tour::class);
    }
}
