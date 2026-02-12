<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WalletResource extends JsonResource
{
  /**
   * Transform the resource into an array.
   *
   * @return array<string, mixed>
   */
  public function toArray(Request $request): array
  {
    $holder = $this->holder;

    return [
      'id' => $this->id,
      'uuid' => $this->uuid,
      'holder' => $this->whenLoaded('holder', function () use ($holder) {
        return [
          'id' => $holder->id,
          'name' => $holder->name,
          'email' => $holder->email,
          'type' => $holder->type ?? null,
        ];
      }),
      'holder_id' => $this->holder_id,
      'holder_type' => $this->holder_type,
      'name' => $this->name,
      'slug' => $this->slug,
      'description' => $this->description,
      'balance' => $this->balance,
      'balance_int' => $this->balanceInt,
      'balance_formatted' => number_format($this->balance, 2),
      'meta' => $this->meta ?? [],
      'currency' => $this->meta['currency'] ?? 'USD',
      'status' => $this->meta['status'] ?? 'active',
      'type' => $this->meta['type'] ?? 'default',

      // Statistics
      'total_deposits' => $this->when($request->has('with_stats'), function () {
        return $this->transactions()->where('type', 'deposit')->sum('amount');
      }),
      'total_withdrawals' => $this->when($request->has('with_stats'), function () {
        return abs($this->transactions()->where('type', 'withdraw')->sum('amount'));
      }),
      'transaction_count' => $this->whenLoaded('transactions', function () {
        return $this->transactions->count();
      }, 0),

      // Dates
      'created_at' => $this->created_at->format('Y-m-d H:i:s'),
      'updated_at' => $this->updated_at->format('Y-m-d H:i:s'),
      'last_transaction_at' => $this->when($this->relationLoaded('transactions') && $this->transactions->isNotEmpty(), function () {
        return $this->transactions->first()->created_at->format('Y-m-d H:i:s');
      }),

      // Links
      'links' => [
        'self' => route('api.wallets.show', $this->uuid),
        'transactions' => route('api.wallets.transactions', $this->uuid),
        'balance' => route('api.wallets.balance', $this->uuid),
      ],
    ];
  }
}
