<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductCommissionCategory extends Model
{
    protected $fillable = [
        'category_name',
        'description',
    ];
}
