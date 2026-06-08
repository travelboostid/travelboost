<?php

namespace App\Models;

use App\Enums\PaymentMethodCategory;
use App\Enums\PaymentMethodStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    protected $fillable = [
        'name',
        'description',
        'provider',
        'method',
        'category',
        'meta',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'category' => PaymentMethodCategory::class,
            'status' => PaymentMethodStatus::class,
            'meta' => 'array',
        ];
    }

    public function scopeEnabled(Builder $query): Builder
    {
        return $query->where('status', PaymentMethodStatus::ENABLED);
    }
}
