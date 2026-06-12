<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VisaCategoryItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'visa_category_id',
        'description',
        'price',
        'is_taxable',
        'sort_order',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_taxable' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function visaCategory()
    {
        return $this->belongsTo(VisaCategory::class);
    }
}
