<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Company;
use App\Models\Transaction;
use Inertia\Inertia;
use Inertia\Response;

class AgentCommissionHistoryController extends Controller
{
    public function index(Company $company): Response
    {
        $companyType = strtolower($company->type->value ?? $company->type);
        abort_unless(in_array($companyType, ['agent', 'vendor'], true), 404);

        $transactions = $company->wallet
            ? $company->wallet
                ->transactions()
                ->whereIn('meta->type', [
                    'booking-agent-commission',
                    'booking agent commission',
                ])
                ->when($companyType === 'agent', fn ($query) => $query->where('amount', '>', 0))
                ->when($companyType === 'vendor', fn ($query) => $query->where('amount', '<', 0))
                ->latest()
                ->get()
            : collect();

        $bookingIds = $transactions
            ->map(fn ($transaction): mixed => data_get($transaction->meta, 'booking_id'))
            ->filter()
            ->unique()
            ->values();

        $bookings = Booking::query()
            ->whereIn('id', $bookingIds)
            ->with(['agent:id,name', 'vendor:id,name', 'user:id,name'])
            ->latest()
            ->get()
            ->keyBy('id');

        $commissions = $transactions->map(function (Transaction $transaction) use ($bookings): array {
            $bookingId = data_get($transaction->meta, 'booking_id');
            $booking = $bookings->get($bookingId);

            return [
                'id' => $transaction->id,
                'booking_code' => data_get($transaction->meta, 'booking_number') ?? $booking?->booking_number ?? '-',
                'agent_name' => $booking?->agent?->name ?? '-',
                'vendor_name' => $booking?->vendor?->name ?? '-',
                'customer_name' => $booking?->user?->name ?? $booking?->contact_name ?? '-',
                'commission_amount' => abs((float) $transaction->amount),
                'paid_at' => $transaction->created_at?->toIso8601String(),
                'created_at' => $transaction->created_at?->toIso8601String(),
            ];
        })->values();

        return Inertia::render('companies/dashboard/commission-history/index', [
            'commissions' => $commissions,
            'summary' => [
                'total_records' => $commissions->count(),
                'total_amount' => (int) round($commissions->sum('commission_amount')),
            ],
            'companyType' => $companyType,
        ]);
    }
}
