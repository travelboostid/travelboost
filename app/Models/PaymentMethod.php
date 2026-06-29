<?php

namespace App\Models;

use App\Enums\PaymentMethodCategory;
use App\Enums\PaymentMethodStatus;
use App\Enums\PaymentMethodUsageScope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    protected $fillable = [
        'name',
        'description',
        'provider',
        'usage_scope',
        'method',
        'category',
        'meta',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'category' => PaymentMethodCategory::class,
            'usage_scope' => PaymentMethodUsageScope::class,
            'status' => PaymentMethodStatus::class,
            'meta' => 'array',
        ];
    }

    public function scopeEnabled(Builder $query): Builder
    {
        return $query->where('status', PaymentMethodStatus::ENABLED);
    }

    public function scopeForUsageScope(Builder $query, PaymentMethodUsageScope $usageScope): Builder
    {
        return $query->where('usage_scope', $usageScope);
    }
}
