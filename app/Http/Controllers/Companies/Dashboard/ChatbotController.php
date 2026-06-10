<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Companies\UpdateChatbotRequest;
use App\Http\Resources\PaymentResource;
use App\Models\AiCreditTopupPayment;
use App\Models\Company;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ChatbotController extends Controller
{
    public function show(Request $request, Company $company)
    {
        $settings = $company->settings()->first();
        $credit = $company->aiCredit()->first();

        $pendingTopup = Payment::query()
            ->whereMorphedTo('owner', $company)
            ->whereMorphedTo('payable', AiCreditTopupPayment::class)
            ->whereIn('status', [PaymentStatus::PENDING, PaymentStatus::UNPAID])
            ->latest()
            ->first();

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
        ]);
    }

    public function update(UpdateChatbotRequest $request, Company $company)
    {
        $validated = $request->validated();
        $company->settings()->update($validated);

        return back();
    }
}
