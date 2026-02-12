<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class PaymentResource extends JsonResource
{
  public function toArray(Request $request): array
  {
    return [
      'id' => $this->id,
      'user_id' => $this->user_id,

      'provider' => $this->provider,
      'payment_method' => $this->payment_method,
      'amount' => (float) $this->amount,
      'status' => $this->status,

      // Important: include payload (contains snap_token, etc)
      'payload' => $this->payload,

      'paid_at' => optional($this->paid_at)->toIso8601String(),
      'created_at' => $this->created_at->toIso8601String(),
      'updated_at' => $this->updated_at->toIso8601String(),

      // polymorphic relation
      'payable' => [
        'type' => Str::snake(class_basename($this->payable_type)),
        'id'   => $this->payable_id,
        'data' => $this->whenLoaded('payable'),
      ],
    ];
  }
}
