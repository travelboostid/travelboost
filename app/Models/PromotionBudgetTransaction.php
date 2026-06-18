<?php

namespace App\Models;

use App\Enums\PromotionBudgetTransactionType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class PromotionBudgetTransaction extends Model
{
    protected $fillable = [
        'company_id',
        'type',
        'platform',
        'amount',
        'reference_type',
        'reference_id',
        'description',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'type' => PromotionBudgetTransactionType::class,
            'amount' => 'decimal:8',
            'meta' => 'array',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function reference(): MorphTo
    {
        return $this->morphTo();
    }
}
