<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Models\AgentSubscriptionPackage;
use App\Models\AgentSubscriptionPayment;
use App\Models\Company;
use App\Models\Payment;
use App\Support\CompanyPermissionMap;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AgentSubscriptionController extends Controller
{
    public function show(Request $request, Company $company)
    {
        abort_unless(
            CompanyPermissionMap::userHasScopedPermission($request->user(), $company, 'subscription-ai.query'),
            403
        );

        $agentSubscriptionPackages = AgentSubscriptionPackage::query()
            ->where('is_active', true)
            ->orderBy('duration_months')
            ->get();

        $agentSubscription = $company->agentSubscription()->with('package')->latest()->first();

        $pendingPayment = Payment::query()
            ->whereMorphedTo('owner', $company)
            ->whereMorphedTo('payable', AgentSubscriptionPayment::class)
            ->whereIn('status', [PaymentStatus::PENDING, PaymentStatus::UNPAID])
            ->latest()
            ->first();

        return Inertia::render('companies/dashboard/agent-subscriptions/index', [
            'agentSubscription' => $agentSubscription,
            'agentSubscriptionPackages' => $agentSubscriptionPackages,
            'pendingPayment' => $pendingPayment
                ? (new PaymentResource($pendingPayment))->resolve($request)
                : null,
        ]);
    }

    public function storeManualPayment(Request $request, Company $company)
    {
        abort_unless(
            CompanyPermissionMap::userHasScopedPermission($request->user(), $company, 'subscription-ai.mutation'),
            403
        );

        $validated = $request->validate([
            'package_id' => ['required', 'exists:agent_subscription_packages,id'],
            'transfer_amount' => ['required', 'numeric', 'min:1'],
            'payment_date' => ['required', 'date'],
            'sender_bank_name' => ['required', 'string'],
            'sender_account_number' => ['required', 'string'],
            'proof' => ['required', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
        ]);

        $package = AgentSubscriptionPackage::findOrFail($validated['package_id']);

        DB::transaction(function () use ($validated, $company, $package, $request) {
            $subscriptionPayment = AgentSubscriptionPayment::create([
                'package_id' => $package->id,
            ]);

            $proofPath = $request->file('proof')->store('payment-proofs', 'public');

            $subscriptionPayment->payment()->create([
                'owner_type' => $company->getMorphClass(),
                'owner_id' => $company->id,
                'amount' => $validated['transfer_amount'],
                'provider' => 'manual',
                'status' => PaymentStatus::PENDING,
                'payload' => [
                    'description' => 'Manual Subscription Extension',
                    'payment_context' => 'manual_subscription_extension',
                    'sender_bank_name' => $validated['sender_bank_name'],
                    'sender_account_number' => $validated['sender_account_number'],
                    'payment_date' => $validated['payment_date'],
                    'proof_path' => $proofPath,
                ],
            ]);
        });

        return back()->with('success', 'Manual subscription payment request submitted.');
    }

    public function paymentHistory(Request $request, Company $company)
    {
        abort_unless(
            CompanyPermissionMap::userHasScopedPermission($request->user(), $company, 'subscription-ai.query'),
            403
        );

        $payments = Payment::query()
            ->with(['payable.package'])
            ->whereMorphedTo('owner', $company)
            ->whereMorphedTo('payable', AgentSubscriptionPayment::class)
            ->latest()
            ->get()
            ->map(function ($payment) {
                $package = $payment->payable?->package;

                return [
                    'id' => (string) $payment->id,
                    'date' => $payment->created_at->toIso8601String(),
                    'period' => $package ? $package->duration_months.' Months' : 'N/A',
                    'amount' => (float) $payment->amount,
                    'status' => $payment->status->value ?? $payment->status,
                    'type' => $payment->provider,
                ];
            });

        return Inertia::render('companies/dashboard/agent-subscriptions/components/payment-history', [
            'payments' => $payments,
        ]);
    }
}
