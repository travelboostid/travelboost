<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Models\AgentSubscriptionPackage;
use App\Models\AgentSubscriptionPayment;
use App\Models\Company;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AgentSubscriptionController extends Controller
{
    public function show(Request $request, Company $company)
    {
        abort_unless(
            $request->user()->isAbleTo('company-settings.query', "company:{$company->id}"),
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
            $request->user()->isAbleTo('company-settings.mutation', "company:{$company->id}"),
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
                    'sender_bank_name' => $validated['sender_bank_name'],
                    'sender_account_number' => $validated['sender_account_number'],
                    'payment_date' => $validated['payment_date'],
                    'proof_path' => $proofPath,
                ],
            ]);
        });

        return back()->with('success', 'Manual subscription payment request submitted.');
    }
}
