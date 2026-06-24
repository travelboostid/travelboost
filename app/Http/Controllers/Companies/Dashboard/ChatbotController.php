<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Companies\UpdateChatbotRequest;
use App\Http\Resources\PaymentResource;
use App\Models\AiCreditTopupPayment;
use App\Models\Company;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ChatbotController extends Controller
{
    public function show(Request $request, Company $company)
    {
        abort_unless(
            $request->user()->isAbleTo('company-settings.query', "company:{$company->id}"),
            403
        );

        $settings = $company->settings()->first();
        $credit = $company->aiCredit()->first();

        $pendingTopup = Payment::query()
            ->whereMorphedTo('owner', $company)
            ->whereMorphedTo('payable', AiCreditTopupPayment::class)
            ->whereIn('status', [PaymentStatus::PENDING, PaymentStatus::UNPAID])
            ->latest()
            ->first();

        $transactions = Payment::query()
            ->whereMorphedTo('owner', $company)
            ->whereMorphedTo('payable', AiCreditTopupPayment::class)
            ->latest()
            ->take(50)
            ->get()
            ->map(fn (Payment $p) => [
                'id' => $p->id,
                'amount' => (int) $p->amount,
                'status' => $p->status->value,
                'created_at' => $p->created_at,
            ]);

        return Inertia::render('companies/dashboard/chatbot/index', [
            'settings' => $settings,
            'credit' => $credit,
            'dailyStats' => $company->aiUsageLogs()
                ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(user_cost) as cost'), DB::raw('COUNT(*) as num_interactions'))
                ->groupBy('date')
                ->orderBy('date')
                ->get(),
            'usageCostToday' => $company->aiUsageLogs()->whereDate('created_at', now()->toDateString())->sum('user_cost'),
            'usageCostIn30Days' => $company->aiUsageLogs()->where('created_at', '>=', now()->subDays(30)->toDateString())->sum('user_cost'),
            'pendingTopup' => $pendingTopup
                ? (new PaymentResource($pendingTopup))->resolve($request)
                : null,
            'transactions' => $transactions,
        ]);
    }

    public function update(UpdateChatbotRequest $request, Company $company)
    {
        abort_unless(
            $request->user()->isAbleTo('company-settings.mutation', "company:{$company->id}"),
            403
        );

        $validated = $request->validated();
        $company->settings()->update($validated);

        return back();
    }

    public function storeManualTopup(Request $request, Company $company)
    {
        abort_unless(
            $request->user()->isAbleTo('company-settings.mutation', "company:{$company->id}"),
            403
        );
        $validated = $request->validate([
            'sender_bank_name' => ['required', 'string', 'max:255'],
            'sender_account_number' => ['required', 'string', 'max:255', 'regex:/^\d+$/'],
            'transfer_amount' => ['required', 'numeric', 'min:1'],
            'payment_date' => ['required', 'date', 'before_or_equal:today'],
            'proof' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
        ]);

        $existingPendingTopup = Payment::query()
            ->whereMorphedTo('owner', $company)
            ->whereMorphedTo('payable', AiCreditTopupPayment::class)
            ->whereIn('status', [PaymentStatus::PENDING, PaymentStatus::UNPAID])
            ->where('provider', 'manual')
            ->latest()
            ->first();

        if ($existingPendingTopup) {
            return back()->withErrors(['amount' => 'You already have a pending top-up request.']);
        }

        $proof = $request->file('proof');
        $path = $proof->store('payment-proofs', 'public');

        DB::transaction(function () use ($company, $validated, $path) {
            $topupPayment = AiCreditTopupPayment::create([
                'amount' => $validated['transfer_amount'],
            ]);

            $topupPayment->payment()->create([
                'owner_type' => $company->getMorphClass(),
                'owner_id' => $company->id,
                'provider' => 'manual',
                'payment_method' => 'bank_transfer',
                'amount' => $validated['transfer_amount'],
                'status' => 'pending',
                'payload' => [
                    'sender_bank' => $validated['sender_bank_name'],
                    'sender_account' => $validated['sender_account_number'],
                    'proof_path' => $path,
                    'payment_date' => Carbon::parse($validated['payment_date'])->toDateString(),
                ],
            ]);
        });

        return back()->with('success', 'Manual top-up request submitted.');
    }
}
