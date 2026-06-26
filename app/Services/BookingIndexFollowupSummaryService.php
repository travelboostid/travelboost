<?php

namespace App\Services;

use App\Enums\PaymentStatus;
use App\Models\Booking;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Support\Facades\DB;

class BookingIndexFollowupSummaryService
{
    private const DUE_SOON_DAYS = 7;

    /**
     * @var list<string>
     */
    private const FOLLOW_UP_STATUSES = [
        'awaiting payment',
        'waiting payment approval',
        'down payment',
        'full payment',
    ];

    /**
     * @return array<string, int|float>
     */
    public function summarize(Builder $companyScope): array
    {
        $metrics = $this->followupMetricsSubquery($companyScope);

        $row = DB::query()
            ->fromSub($metrics, 'followup_metrics')
            ->selectRaw("
                COUNT(*) FILTER (WHERE payment_state = 'overdue')::int AS payment_overdue,
                COALESCE(SUM(amount_due) FILTER (WHERE payment_state = 'overdue'), 0)::float AS payment_overdue_amount,
                COUNT(*) FILTER (WHERE payment_state = 'due' AND payment_days_remaining BETWEEN 0 AND ?)::int AS payment_due_soon,
                COALESCE(SUM(amount_due) FILTER (WHERE payment_state = 'due' AND payment_days_remaining BETWEEN 0 AND ?), 0)::float AS payment_due_soon_amount,
                COUNT(*) FILTER (WHERE document_state = 'incomplete')::int AS documents_incomplete,
                COUNT(*) FILTER (WHERE document_state = 'incomplete' AND document_days_remaining BETWEEN 0 AND ?)::int AS documents_due_soon
            ", [self::DUE_SOON_DAYS, self::DUE_SOON_DAYS, self::DUE_SOON_DAYS])
            ->first();

        if ($row === null) {
            return $this->emptySummary();
        }

        return [
            'payment_overdue' => (int) ($row->payment_overdue ?? 0),
            'payment_overdue_amount' => (float) ($row->payment_overdue_amount ?? 0),
            'payment_due_soon' => (int) ($row->payment_due_soon ?? 0),
            'payment_due_soon_amount' => (float) ($row->payment_due_soon_amount ?? 0),
            'documents_incomplete' => (int) ($row->documents_incomplete ?? 0),
            'documents_due_soon' => (int) ($row->documents_due_soon ?? 0),
        ];
    }

    private function followupMetricsSubquery(Builder $companyScope): Builder
    {
        $bookingMorph = Booking::class;
        $paidStatus = PaymentStatus::PAID->value;
        $pendingStatus = PaymentStatus::PENDING->value;

        $paidTotals = DB::table('payments')
            ->select('payable_id', DB::raw('COALESCE(SUM(amount), 0) as paid_total'))
            ->where('payable_type', $bookingMorph)
            ->where('status', $paidStatus)
            ->groupBy('payable_id');

        return (clone $companyScope)
            ->whereIn('bookings.status', self::FOLLOW_UP_STATUSES)
            ->leftJoinSub($paidTotals, 'paid_totals', 'paid_totals.payable_id', '=', 'bookings.id')
            ->leftJoin('company_settings as cs', 'cs.company_id', '=', 'bookings.vendor_id')
            ->leftJoinSub($this->missingDocumentsSubquery(), 'doc_missing', 'doc_missing.booking_id', '=', 'bookings.id')
            ->selectRaw("
                bookings.id,
                GREATEST(0, bookings.grand_total - COALESCE(paid_totals.paid_total, 0))::float AS amount_due,
                CASE
                    WHEN GREATEST(0, bookings.grand_total - COALESCE(paid_totals.paid_total, 0)) <= 0 THEN 'paid'
                    WHEN bookings.status = 'waiting payment approval'
                        AND bookings.reserved_type = 'payment_in_progress'
                        AND NOT EXISTS (
                            SELECT 1
                            FROM payments pending_manual
                            WHERE pending_manual.payable_type = ?
                              AND pending_manual.payable_id = bookings.id
                              AND pending_manual.provider = 'manual'
                              AND pending_manual.payment_method = 'bank_transfer'
                              AND pending_manual.status = ?
                        )
                        THEN CASE
                            WHEN (DATE(bookings.departure_date) - (COALESCE(cs.full_payment_deadline, 0) * INTERVAL '1 day'))::date < CURRENT_DATE
                                THEN 'overdue'
                            ELSE 'due'
                        END
                    WHEN bookings.status = 'waiting payment approval' THEN 'pending_approval'
                    WHEN (DATE(bookings.departure_date) - (COALESCE(cs.full_payment_deadline, 0) * INTERVAL '1 day'))::date < CURRENT_DATE
                        THEN 'overdue'
                    ELSE 'due'
                END AS payment_state,
                CASE
                    WHEN bookings.departure_date IS NULL THEN NULL
                    ELSE (DATE(bookings.departure_date) - (COALESCE(cs.full_payment_deadline, 0) * INTERVAL '1 day'))::date - CURRENT_DATE
                END AS payment_days_remaining,
                CASE
                    WHEN COALESCE(doc_missing.missing_count, 0) > 0 THEN 'incomplete'
                    ELSE 'completed'
                END AS document_state,
                CASE
                    WHEN bookings.departure_date IS NULL THEN NULL
                    ELSE (DATE(bookings.departure_date) - (COALESCE(cs.document_completed_deadline, 0) * INTERVAL '1 day'))::date - CURRENT_DATE
                END AS document_days_remaining
            ", [$bookingMorph, $pendingStatus]);
    }

    private function missingDocumentsSubquery(): QueryBuilder
    {
        return DB::table('booking_passengers as bp')
            ->select('bp.booking_id', DB::raw('COUNT(*) as missing_count'))
            ->whereRaw("LOWER(bp.price_category) NOT LIKE '%infant%'")
            ->where(function ($query): void {
                $query->where(function ($passport): void {
                    $passport->whereNull('bp.passport_number')->orWhere('bp.passport_number', '');
                })
                    ->orWhereNull('bp.passport_issue_date')
                    ->orWhereNull('bp.passport_expiry_date')
                    ->orWhere(function ($passportFile): void {
                        $passportFile->whereNull('bp.passport_file_path')->orWhere('bp.passport_file_path', '');
                    })
                    ->orWhere(function ($visaNumber): void {
                        $visaNumber->whereNull('bp.visa_number')->orWhere('bp.visa_number', '');
                    })
                    ->orWhere(function ($visaFile): void {
                        $visaFile->whereNull('bp.visa_file_path')->orWhere('bp.visa_file_path', '');
                    });
            })
            ->groupBy('bp.booking_id');
    }

    /**
     * @return array<string, int|float>
     */
    private function emptySummary(): array
    {
        return [
            'payment_overdue' => 0,
            'payment_overdue_amount' => 0,
            'payment_due_soon' => 0,
            'payment_due_soon_amount' => 0,
            'documents_incomplete' => 0,
            'documents_due_soon' => 0,
        ];
    }
}
