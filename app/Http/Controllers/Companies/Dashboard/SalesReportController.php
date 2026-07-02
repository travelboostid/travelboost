<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingAddon;
use App\Models\BookingPassenger;
use App\Models\Company;
use App\Models\Payment;
use App\Models\TourPrice;
use App\Models\TourSchedule;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Contracts\View\View;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Events\AfterSheet;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class SalesReportController extends Controller
{
    public function index(Company $company, Request $request): Response
    {
        $companyType = $this->companyType($company);
        abort_unless(in_array($companyType, ['agent', 'vendor'], true), 404);

        $filters = $this->filters($request);
        $rows = $this->buildRows($company, $filters);
        $options = $this->buildOptions($company, $filters);

        return Inertia::render('companies/dashboard/reports/sales/index', [
            'rows' => $rows,
            'summary' => $this->summary($rows),
            'filters' => $filters,
            'options' => $options,
            'companyType' => $companyType,
        ]);
    }

    public function exportExcel(Company $company, Request $request)
    {
        $data = $this->exportData($company, $request);
        $filename = $this->filename('xlsx');

        return Excel::download(
            new class($data) implements FromView, WithColumnWidths, WithEvents, WithStyles
            {
                public function __construct(private readonly array $data) {}

                public function view(): View
                {
                    return view('exports.sales-report', $this->data);
                }

                public function columnWidths(): array
                {
                    return [
                        'A' => 6,
                        'B' => 18,
                        'C' => 26,
                        'D' => 16,
                        'E' => 36,
                        'F' => 24,
                        'G' => 18,
                        'H' => 24,
                        'I' => 8,
                        'J' => 20,
                        'K' => 26,
                        'L' => 26,
                        'M' => 18,
                        'N' => 16,
                        'O' => 26,
                        'P' => 18,
                        'Q' => 18,
                        'R' => 18,
                        'S' => 18,
                    ];
                }

                public function styles(Worksheet $sheet): array
                {
                    $sheet->getStyle($sheet->calculateWorksheetDimension())
                        ->getAlignment()
                        ->setWrapText(true)
                        ->setVertical(Alignment::VERTICAL_CENTER);

                    $sheet->getStyle('A1:S3')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                    $sheet->getStyle('A4:S4')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                    $sheet->getDefaultRowDimension()->setRowHeight(-1);

                    return [];
                }

                public function registerEvents(): array
                {
                    return [
                        AfterSheet::class => function (AfterSheet $event): void {
                            $worksheet = $event->sheet->getDelegate();
                            $highestRow = $worksheet->getHighestRow();
                            $totalRow = $highestRow;
                            $worksheet->mergeCells('A1:S1');
                            $worksheet->mergeCells('A2:S2');
                            $worksheet->mergeCells('A3:S3');
                            $worksheet->freezePane('A5');
                            $worksheet->setAutoFilter("A4:S{$highestRow}");
                            $worksheet->setShowGridlines(false);
                            $worksheet->getRowDimension(1)->setRowHeight(30);
                            $worksheet->getRowDimension(2)->setRowHeight(22);
                            $worksheet->getRowDimension(3)->setRowHeight(22);
                            $worksheet->getRowDimension(4)->setRowHeight(30);
                            $worksheet->getStyle('A1:S3')->applyFromArray([
                                'fill' => [
                                    'fillType' => Fill::FILL_SOLID,
                                    'startColor' => ['rgb' => 'EEF4FF'],
                                ],
                                'borders' => [
                                    'bottom' => [
                                        'borderStyle' => Border::BORDER_THIN,
                                        'color' => ['rgb' => 'CBD5E1'],
                                    ],
                                ],
                            ]);
                            $worksheet->getStyle('A1')->getFont()->setBold(true)->setSize(18)->getColor()->setRGB('0F172A');
                            $worksheet->getStyle('A2')->getFont()->setBold(true)->setSize(12)->getColor()->setRGB('111827');
                            $worksheet->getStyle('A3')->getFont()->setSize(10)->getColor()->setRGB('64748B');
                            $worksheet->getStyle('A1:S3')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setVertical(Alignment::VERTICAL_CENTER);
                            $worksheet->getStyle('A4:S4')->applyFromArray([
                                'font' => [
                                    'bold' => true,
                                    'color' => ['rgb' => 'FFFFFF'],
                                ],
                                'fill' => [
                                    'fillType' => Fill::FILL_SOLID,
                                    'startColor' => ['rgb' => '1E293B'],
                                ],
                            ]);
                            $worksheet->getStyle('A4:S4')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
                            $worksheet->getStyle("A4:S{$highestRow}")->applyFromArray([
                                'borders' => [
                                    'allBorders' => [
                                        'borderStyle' => Border::BORDER_THIN,
                                        'color' => ['rgb' => 'D9E2EF'],
                                    ],
                                ],
                            ]);
                            $worksheet->getStyle("A5:S{$highestRow}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
                            $worksheet->getStyle("A5:A{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                            $worksheet->getStyle("G5:G{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                            $worksheet->getStyle("J5:J{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                            $worksheet->getStyle("K5:S{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                            $worksheet->getStyle("J5:J{$highestRow}")->getNumberFormat()->setFormatCode('#,##0');
                            $worksheet->getStyle("K5:S{$highestRow}")->getNumberFormat()->setFormatCode('"Rp" #,##0');

                            for ($row = 5; $row < $totalRow; $row++) {
                                if ($row % 2 === 0) {
                                    $worksheet->getStyle("A{$row}:S{$row}")->applyFromArray([
                                        'fill' => [
                                            'fillType' => Fill::FILL_SOLID,
                                            'startColor' => ['rgb' => 'F8FAFC'],
                                        ],
                                    ]);
                                }

                                $worksheet->getRowDimension($row)->setRowHeight(-1);
                            }

                            $worksheet->getStyle("A{$totalRow}:S{$totalRow}")->applyFromArray([
                                'font' => [
                                    'bold' => true,
                                    'color' => ['rgb' => '0F172A'],
                                ],
                                'fill' => [
                                    'fillType' => Fill::FILL_SOLID,
                                    'startColor' => ['rgb' => 'E2E8F0'],
                                ],
                            ]);
                            $worksheet->getRowDimension($totalRow)->setRowHeight(26);
                        },
                    ];
                }
            },
            $filename,
        );
    }

    private function exportData(Company $company, Request $request): array
    {
        $companyType = $this->companyType($company);
        abort_unless(in_array($companyType, ['agent', 'vendor'], true), 404);

        $filters = $this->filters($request);
        $rows = $this->buildRows($company, $filters);

        return [
            'company' => $company,
            'companyType' => $companyType,
            'rows' => $rows,
            'summary' => $this->summary($rows),
            'filters' => $filters,
            'generatedAt' => now(),
        ];
    }

    private function buildRows(Company $company, array $filters): Collection
    {
        $bookings = $this->baseBookingQuery($company, $filters)
            ->with([
                'agent:id,name',
                'agent.users:id',
                'vendor:id,name',
                'tour:id,name,code',
                'user:id,name,email',
                'passengers',
                'addons:id,booking_id,name,price,is_taxable',
                'payments' => function ($query): void {
                    $query
                        ->where('status', PaymentStatus::PAID->value)
                        ->orderBy('paid_at')
                        ->orderBy('created_at');
                },
            ])
            ->latest()
            ->get();

        $schedules = $this->scheduleMap($bookings);
        $companyType = $this->companyType($company);

        return $bookings
            ->map(function (Booking $booking) use ($companyType, $schedules): ?array {
                $paidPayments = $booking->payments
                    ->filter(fn (Payment $payment): bool => $payment->status === PaymentStatus::PAID)
                    ->sortBy(fn (Payment $payment): string => (string) ($payment->paid_at ?? $payment->created_at))
                    ->values();

                $fullPayment = $this->resolveFinalFullPayment($paidPayments);

                if (! $fullPayment) {
                    return null;
                }

                $paymentDate = $this->resolvePaymentDate($fullPayment);
                $agentUserId = $booking->agent?->users?->first()?->id;
                $pax = (int) $booking->pax_adult + (int) $booking->pax_child + (int) $booking->pax_infant;
                $departureDate = $this->dateString($booking->departure_date);
                $schedule = $schedules->get($this->scheduleKey((int) $booking->tour_id, $departureDate));
                $commissionAmount = $this->resolveCommissionAmount($booking);
                $pricing = $this->passengerPricingSummary($booking, $schedule);
                $taxableVisaRows = $this->visaBreakdownRows($booking->passengers, true);
                $nonTaxableVisaRows = $this->visaBreakdownRows($booking->passengers, false);
                $taxableAddonRows = $this->addonBreakdownRows($booking->addons, true);
                $nonTaxableAddonRows = $this->addonBreakdownRows($booking->addons, false);

                return [
                    'id' => $booking->id,
                    'agent_code' => $agentUserId ? str_pad((string) $agentUserId, 4, '0', STR_PAD_LEFT) : '-',
                    'agent_name' => $booking->agent?->name ?? '-',
                    'vendor_name' => $booking->vendor?->name ?? '-',
                    'tour_code' => $booking->tour?->code ?? '-',
                    'tour_name' => $booking->tour?->name ?? '-',
                    'departure_date' => $departureDate,
                    'return_date' => $this->dateString($schedule?->return_date),
                    'booking_code' => $booking->booking_number,
                    'booking_contact' => $booking->contact_name ?: $booking->user?->name ?: '-',
                    'booking_date' => $booking->created_at?->toIso8601String(),
                    'pax' => $pax,
                    'base_tour_total' => (float) $pricing['discounted_total'],
                    'base_tour_average' => (float) $pricing['average_price'],
                    'taxable_visa_total' => (float) $taxableVisaRows->sum('amount'),
                    'taxable_addon_total' => (float) $taxableAddonRows->sum('amount'),
                    'vat_amount' => (float) $booking->tax_amount,
                    'promo_amount' => (float) $pricing['promo_amount'],
                    'non_taxable_visa_total' => (float) $nonTaxableVisaRows->sum('amount'),
                    'non_taxable_addon_total' => (float) $nonTaxableAddonRows->sum('amount'),
                    'platform_fee' => (float) $booking->platform_fee,
                    'grand_total' => (float) $booking->grand_total,
                    'commission_amount' => $commissionAmount,
                    'paid_at' => $paymentDate?->toIso8601String(),
                    'taxable_visa_items' => $taxableVisaRows->values()->all(),
                    'taxable_addon_items' => $taxableAddonRows->values()->all(),
                    'non_taxable_visa_items' => $nonTaxableVisaRows->values()->all(),
                    'non_taxable_addon_items' => $nonTaxableAddonRows->values()->all(),
                    'visible_agent_identity' => $companyType === 'vendor',
                ];
            })
            ->filter()
            ->filter(fn (array $row): bool => $this->rowMatchesPeriod($row, $filters))
            ->sortByDesc(fn (array $row): int => Carbon::parse((string) $row['paid_at'])->timestamp)
            ->values();
    }

    private function baseBookingQuery(Company $company, array $filters): Builder
    {
        $companyType = $this->companyType($company);

        return Booking::query()
            ->where('status', BookingStatus::FULL_PAYMENT->value)
            ->when($companyType === 'vendor', function (Builder $query) use ($company): void {
                $query->where('vendor_id', $company->id);
            })
            ->when($companyType === 'agent', function (Builder $query) use ($company): void {
                $query->where('agent_id', $company->id);
            })
            ->when($filters['agent_id'] && $companyType === 'vendor', function (Builder $query) use ($filters): void {
                $query->where('agent_id', $filters['agent_id']);
            })
            ->when($filters['tour_code'], function (Builder $query) use ($filters): void {
                $query->whereHas('tour', function (Builder $query) use ($filters): void {
                    $query->where('code', $filters['tour_code']);
                });
            })
            ->when($filters['departure_date'], function (Builder $query) use ($filters): void {
                $query->whereDate('departure_date', $filters['departure_date']);
            });
    }

    private function buildOptions(Company $company, array $filters): array
    {
        $rows = $this->buildRows($company, [
            ...$filters,
            'agent_id' => null,
            'tour_code' => null,
            'departure_date' => null,
        ]);

        $agents = $this->companyType($company) === 'vendor'
            ? $rows
                ->filter(fn (array $row): bool => $row['agent_name'] !== '-')
                ->map(fn (array $row): array => [
                    'id' => (int) ltrim((string) $row['agent_code'], '0'),
                    'name' => $row['agent_name'],
                    'company_id' => $this->agentCompanyIdForName($company, $row['agent_name']),
                ])
                ->filter(fn (array $row): bool => (int) ($row['company_id'] ?? 0) > 0)
                ->unique('company_id')
                ->sortBy('name')
                ->map(fn (array $row): array => [
                    'id' => (int) $row['company_id'],
                    'name' => $row['name'],
                ])
                ->values()
            : collect();

        $tourCodes = $rows
            ->filter(fn (array $row): bool => filled($row['tour_code']))
            ->map(fn (array $row): array => [
                'code' => $row['tour_code'],
                'name' => $row['tour_name'],
            ])
            ->unique('code')
            ->sortBy('code')
            ->values();

        $departureDates = filled($filters['tour_code'])
            ? $rows
                ->filter(fn (array $row): bool => $row['tour_code'] === $filters['tour_code'])
                ->pluck('departure_date')
                ->filter()
                ->unique()
                ->sort()
                ->values()
            : collect();

        return [
            'agents' => $agents,
            'tourCodes' => $tourCodes,
            'departureDates' => $departureDates,
        ];
    }

    private function filters(Request $request): array
    {
        return [
            'period_from' => $request->input('period_from') ?: now()->startOfMonth()->toDateString(),
            'period_to' => $request->input('period_to') ?: now()->toDateString(),
            'agent_id' => $request->input('agent_id') ?: null,
            'tour_code' => $request->input('tour_code') ?: null,
            'departure_date' => $request->input('departure_date') ?: null,
        ];
    }

    private function scheduleMap(Collection $bookings): Collection
    {
        $scheduleQuery = TourSchedule::query();
        $hasSchedules = false;

        $bookings
            ->filter(fn (Booking $booking): bool => filled($booking->tour_id) && filled($booking->departure_date))
            ->each(function (Booking $booking) use ($scheduleQuery, &$hasSchedules): void {
                $hasSchedules = true;

                $scheduleQuery->orWhere(function (Builder $query) use ($booking): void {
                    $query
                        ->where('tour_id', $booking->tour_id)
                        ->whereDate('departure_date', $booking->departure_date);
                });
            });

        if (! $hasSchedules) {
            return collect();
        }

        return $scheduleQuery
            ->get()
            ->keyBy(fn (TourSchedule $schedule): string => $this->scheduleKey($schedule->tour_id, $this->dateString($schedule->departure_date)));
    }

    private function scheduleKey(int $tourId, ?string $departureDate): string
    {
        return "{$tourId}|{$departureDate}";
    }

    private function dateString(mixed $date): ?string
    {
        if (blank($date)) {
            return null;
        }

        if ($date instanceof CarbonInterface) {
            return $date->toDateString();
        }

        return Carbon::parse($date)->toDateString();
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

    private function passengerPricingSummary(Booking $booking, ?TourSchedule $schedule): array
    {
        $tourPrices = $schedule && $booking->tour
            ? TourPrice::query()
                ->with('priceCategory')
                ->where('tour_code', $booking->tour->code)
                ->where('schedule_id', $schedule->id)
                ->get()
                ->keyBy(fn (TourPrice $price): string => (string) $price->priceCategory?->name)
            : collect();

        $discountedTotal = 0.0;
        $originalTotal = 0.0;

        foreach ($booking->passengers as $passenger) {
            $discountedPrice = (float) ($passenger->price_amount ?? 0);
            $matchedPrice = $tourPrices->get((string) $passenger->price_category);
            $originalPrice = $matchedPrice ? (float) $matchedPrice->price : $discountedPrice;

            $discountedTotal += $discountedPrice;
            $originalTotal += $originalPrice;
        }

        if ($discountedTotal <= 0) {
            $discountedTotal = (float) $booking->total_price;
            $originalTotal = max($originalTotal, $discountedTotal);
        }

        $pax = max(1, (int) $booking->pax_adult + (int) $booking->pax_child + (int) $booking->pax_infant);

        return [
            'average_price' => $discountedTotal / $pax,
            'discounted_total' => $discountedTotal,
            'promo_amount' => max(0, $originalTotal - $discountedTotal),
        ];
    }

    private function resolveFinalFullPayment(Collection $paidPayments): ?Payment
    {
        $fullPayments = $paidPayments
            ->filter(fn (Payment $payment): bool => $payment->bookingPaymentType() === Payment::BOOKING_PAYMENT_TYPE_FULL_PAYMENT)
            ->values();

        return $fullPayments->last() ?? $paidPayments->last();
    }

    private function resolvePaymentDate(Payment $payment): ?Carbon
    {
        $payloadPaymentDate = data_get($payment->payload, 'payment_date');

        if (filled($payloadPaymentDate)) {
            return Carbon::parse((string) $payloadPaymentDate);
        }

        if ($payment->paid_at) {
            return Carbon::parse($payment->paid_at);
        }

        return $payment->created_at ? Carbon::parse($payment->created_at) : null;
    }

    private function rowMatchesPeriod(array $row, array $filters): bool
    {
        $paidAt = $row['paid_at'] ?? null;

        if (! $paidAt) {
            return false;
        }

        $paidDate = Carbon::parse((string) $paidAt)->toDateString();

        if (filled($filters['period_from']) && $paidDate < $filters['period_from']) {
            return false;
        }

        if (filled($filters['period_to']) && $paidDate > $filters['period_to']) {
            return false;
        }

        return true;
    }

    /**
     * @param  Collection<int, BookingPassenger>  $passengers
     * @return Collection<int, array{label: string, quantity: int, unit_price: float, amount: float}>
     */
    private function visaBreakdownRows(Collection $passengers, bool $taxable): Collection
    {
        return $passengers
            ->filter(function (BookingPassenger $passenger) use ($taxable): bool {
                return filled($passenger->visa_type_description)
                    && (float) ($passenger->visa_type_price ?? 0) > 0
                    && (bool) $passenger->visa_type_is_taxable === $taxable;
            })
            ->groupBy(function (BookingPassenger $passenger): string {
                return mb_strtolower((string) $passenger->visa_type_description).'|'.(string) $passenger->visa_type_price;
            })
            ->map(function (Collection $group): array {
                /** @var BookingPassenger $passenger */
                $passenger = $group->first();
                $quantity = $group->count();
                $unitPrice = (float) ($passenger->visa_type_price ?? 0);

                return [
                    'label' => (string) $passenger->visa_type_description,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'amount' => $unitPrice * $quantity,
                ];
            })
            ->values();
    }

    /**
     * @param  Collection<int, BookingAddon>  $addons
     * @return Collection<int, array{label: string, quantity: int, unit_price: float, amount: float}>
     */
    private function addonBreakdownRows(Collection $addons, bool $taxable): Collection
    {
        return $addons
            ->filter(fn (BookingAddon $addon): bool => (bool) $addon->is_taxable === $taxable)
            ->groupBy(function (BookingAddon $addon): string {
                return mb_strtolower((string) $addon->name).'|'.(string) $addon->price;
            })
            ->map(function (Collection $group): array {
                /** @var BookingAddon $addon */
                $addon = $group->first();
                $quantity = $group->count();
                $unitPrice = (float) $addon->price;

                return [
                    'label' => (string) $addon->name,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'amount' => $unitPrice * $quantity,
                ];
            })
            ->values();
    }

    private function agentCompanyIdForName(Company $company, string $agentName): ?int
    {
        return Booking::query()
            ->where('vendor_id', $company->id)
            ->whereHas('agent', fn (Builder $query): Builder => $query->where('name', $agentName))
            ->value('agent_id');
    }

    private function summary(Collection $rows): array
    {
        return [
            'total_bookings' => $rows->count(),
            'total_pax' => (int) $rows->sum('pax'),
            'total_sales' => (float) $rows->sum('grand_total'),
            'total_commission' => (float) $rows->sum('commission_amount'),
            'base_tour_total' => (float) $rows->sum('base_tour_total'),
            'taxable_visa_total' => (float) $rows->sum('taxable_visa_total'),
            'taxable_addon_total' => (float) $rows->sum('taxable_addon_total'),
            'vat_total' => (float) $rows->sum('vat_amount'),
            'promo_total' => (float) $rows->sum('promo_amount'),
            'non_taxable_visa_total' => (float) $rows->sum('non_taxable_visa_total'),
            'non_taxable_addon_total' => (float) $rows->sum('non_taxable_addon_total'),
            'platform_fee_total' => (float) $rows->sum('platform_fee'),
        ];
    }

    private function filename(string $extension): string
    {
        return 'Sales_Report_'.now()->format('Y-m-d_His').'.'.$extension;
    }

    private function companyType(Company $company): string
    {
        return strtolower($company->type->value ?? $company->type);
    }
}
