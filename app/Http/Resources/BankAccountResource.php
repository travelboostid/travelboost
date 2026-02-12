<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BankAccountResource extends JsonResource
{
  public function toArray(Request $request): array
  {
    return [
      'id' => $this->id,

      'provider' => $this->provider,
      'account_number' => $this->account_number,
      'account_name' => $this->account_name,
      'branch' => $this->branch,

      'status' => $this->status,
      'is_default' => $this->is_default,

      'created_at' => $this->created_at,
    ];
  }
}
