<?php

namespace App\Models;

use Bavix\Wallet\Models\Wallet as WalletBase;
use Illuminate\Database\Eloquent\Builder;

class Wallet extends WalletBase
{
    public function scopeWhereHolderIn(
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
                        ->whereMorphedTo('holder', $type)
                        ->whereIn('holder_id', $ids);
                });
            }
        });
    }
}
