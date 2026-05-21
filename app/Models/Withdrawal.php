<?php

namespace App\Models;

use App\Enums\WithdrawalMethod;
use App\Enums\WithdrawalStatus;
use App\Events\WithdrawalUpdated;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Withdrawal extends Model
{
    protected $fillable = [
        'owner_type',
        'owner_id',
        'bank_account_id',
        'wallet_id',
        'amount',
        'method',
        'status',
        'note',
        'processing_at',
        'cancelled_at',
        'rejected_at',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'cancelled_at' => 'datetime',
        'rejected_at' => 'datetime',
        'paid_at' => 'datetime',
        'method' => WithdrawalMethod::class,
        'status' => WithdrawalStatus::class,
    ];

    public function owner()
    {
        return $this->morphTo();
    }

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(Wallet::class);
    }

    protected $dispatchesEvents = [
        'updated' => WithdrawalUpdated::class,
    ];

    public function scopeWhereOwnerIn(
        Builder $query,
        array $owners
    ): Builder {
        $grouped = [];

        foreach ($owners as [$type, $id]) {
            $grouped[$type][] = $id;
        }

        return $query->where(function (Builder $query) use ($grouped) {
            foreach ($grouped as $type => $ids) {
                $query->orWhere(function (Builder $query) use ($type, $ids) {
                    $query
                        ->whereMorphedTo('owner', $type)
                        ->whereIn('owner_id', $ids);
                });
            }
        });
    }
}
