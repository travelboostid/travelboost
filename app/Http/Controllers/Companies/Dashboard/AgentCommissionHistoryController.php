<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Company;
use App\Models\TourPrice;
use App\Models\TourSchedule;
use Inertia\Inertia;
use Inertia\Response;

class AgentCommissionHistoryController extends Controller
{
    public function index(Company $company): Response
    {
        abort_unless(($company->type->value ?? $company->type) === 'agent', 404);

        $bookings = Booking::query()
            ->where('agent_id', $company->id)
            ->where('status', BookingStatus::FULL_PAYMENT)
            ->with([
                'vendor:id,name',
                'user:id,name',
                'tour:id,name,code',
                'payments' => function ($query): void {
                    $query
                        ->where('status', PaymentStatus::PAID)
                        ->orderByDesc('paid_at')
                        ->latest();
                },
            ])
            ->latest()
            ->get();

        $commissions = $bookings->map(function (Booking $booking): array {
            $fullPayment = $booking->payments->first();
            $commissionAmount = $this->resolveCommissionAmount($booking);

            return [
                'id' => $booking->id,
                'booking_code' => $booking->booking_number,
                'vendor_name' => $booking->vendor?->name ?? '-',
                'customer_name' => $booking->user?->name ?? $booking->contact_name ?? '-',
                'commission_amount' => $commissionAmount,
                'paid_at' => $fullPayment?->paid_at?->toIso8601String(),
                'created_at' => $booking->created_at?->toIso8601String(),
            ];
        });

        return Inertia::render('companies/dashboard/commission-history/index', [
            'commissions' => $commissions,
            'summary' => [
                'total_records' => $commissions->count(),
                'total_amount' => (int) round($commissions->sum('commission_amount')),
            ],
        ]);
    }

    private function resolveCommissionAmount(Booking $booking): float
    {
        $commissionAmount = (float) ($booking->commission_amount ?? 0);

        if ($commissionAmount > 0) {
            return $commissionAmount;
        }

        $schedule = TourSchedule::query()
            ->where('tour_id', $booking->tour_id)
            ->whereDate('departure_date', $booking->departure_date)
            ->first();

        if (! $schedule || ! $booking->tour) {
            return 0;
        }

        $tourPrice = TourPrice::query()
            ->where('tour_code', $booking->tour->code)
            ->where('schedule_id', $schedule->id)
            ->first();

        if (! $tourPrice) {
            return 0;
        }

        $paxCount = (int) $booking->pax_adult + (int) $booking->pax_child;

        if ((float) $tourPrice->commission > 0) {
            return (float) $tourPrice->commission * $paxCount;
        }

        if ((float) $tourPrice->commission_rate > 0) {
            return ((float) $tourPrice->commission_rate / 100)
                * (float) $tourPrice->price
                * $paxCount;
        }

        return 0;
    }
}
