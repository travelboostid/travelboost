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
use Inertia\Inertia;

class AgentSubscriptionController extends Controller
{
    public function show(Request $request, Company $company)
    {
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
}
