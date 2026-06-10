<?php

namespace App\Http\Controllers\Webapi;

use App\Enums\PaymentMethodStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentMethodResource;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PaymentMethodController extends Controller
{
    /**
     * List available payment methods.
     *
     * @operationId getPaymentMethods
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'status' => ['nullable', Rule::enum(PaymentMethodStatus::class)],
        ]);

        $paymentMethods = PaymentMethod::query()
            ->when(
                isset($validated['status']),
                fn ($query) => $query->where('status', $validated['status']),
                fn ($query) => $query->enabled(),
            )
            ->orderBy('name')
            ->get();

        return PaymentMethodResource::collection($paymentMethods);
    }
}
