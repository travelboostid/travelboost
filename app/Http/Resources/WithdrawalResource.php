<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WithdrawalResource extends JsonResource
{
  public function toArray(Request $request): array
  {
    return [
      'id' => $this->id,

      'user_id' => $this->user_id,
      'bank_account_id' => $this->bank_account_id,
      'wallet_id' => $this->wallet_id,

      'amount' => (float) $this->amount,
      'status' => $this->status,
      'note' => $this->note,

      'approved_at' => $this->approved_at,
      'processed_at' => $this->processed_at,
      'paid_at' => $this->paid_at,

      'created_at' => $this->created_at,
    ];
  }
}
