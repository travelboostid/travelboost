<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductCommissionCategory extends Model
{
    protected $fillable = [
        'company_id',
        'category_name',
        'description',
        'slug',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected $appends = [
        'name',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function tours(): HasMany
    {
        return $this->hasMany(Tour::class);
    }

    public function commissionRules(): HasMany
    {
        return $this->hasMany(TourCommissionRule::class);
    }

    protected function name(): Attribute
    {
        return Attribute::make(
            get: fn (): string => (string) $this->category_name,
        );
    }
}
