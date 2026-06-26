<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\AiCreditTopupPayment;
use App\Models\Company;
use App\Models\Payment;
use App\Support\CompanyPermissionMap;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ChatbotPaymentHistoryController extends Controller
{
    public function index(Request $request, Company $company)
    {
        abort_unless(
            CompanyPermissionMap::userHasScopedPermission($request->user(), $company, 'chat-ai.query'),
            403
        );

        $transactions = Payment::query()
            ->whereMorphedTo('owner', $company)
            ->whereMorphedTo('payable', AiCreditTopupPayment::class)
            ->latest()
            ->paginate(15)
            ->through(fn (Payment $p) => [
                'id' => $p->id,
                'amount' => (int) $p->amount,
                'status' => $p->status->value,
                'provider' => $p->provider,
                'payment_method' => $p->payment_method,
                'created_at' => $p->created_at,
            ]);

        return Inertia::render('companies/dashboard/chatbot-payment-history/index', [
            'transactions' => $transactions,
        ]);
    }
}
