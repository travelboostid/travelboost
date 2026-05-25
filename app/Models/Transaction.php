<?php

namespace App\Models;

use Bavix\Wallet\Models\Transaction as TransactionBase;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Transaction extends TransactionBase
{
    public function scopeWhereWalletHolder(
        Builder $query,
        Model|iterable|string|null $type,
        int|string $id,
    ): Builder {
        return $query->whereRelation('wallet', function ($query) use ($type, $id) {
            $query
                ->whereMorphedTo('holder', $type)
                ->where('holder_id', $id);
        });
    }
}
