<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Company;
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
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Events\AfterSheet;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class CommissionReportController extends Controller
{
    public function index(Company $company, Request $request): Response
    {
        $companyType = $this->companyType($company);
        abort_unless(in_array($companyType, ['agent', 'vendor'], true), 404);

        $filters = $this->filters($request);
        $rows = $this->buildRows($company, $filters);
        $options = $this->buildOptions($company, $filters);

        return Inertia::render('companies/dashboard/reports/commission/index', [
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

        return Excel::download(
            new class($data) implements FromView, ShouldAutoSize, WithColumnWidths, WithEvents, WithStyles
            {
                public function __construct(private readonly array $data) {}

                public function view(): View
                {
                    return view('exports.commission-report', $this->data);
                }

                public function columnWidths(): array
                {
                    return [
                        'A' => 6,
                        'B' => 16,
                        'C' => 28,
                        'D' => 14,
                        'E' => 32,
                        'F' => 26,
                        'G' => 20,
                        'H' => 26,
                        'I' => 8,
                        'J' => 18,
                    ];
                }

                public function styles(Worksheet $sheet): array
                {
                    $sheet->getStyle($sheet->calculateWorksheetDimension())
                        ->getAlignment()
                        ->setWrapText(true)
                        ->setVertical(Alignment::VERTICAL_CENTER);

                    $sheet->getStyle('A1:J3')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                    $sheet->getStyle('A4:J4')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
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
                            $worksheet->mergeCells('A1:J1');
                            $worksheet->mergeCells('A2:J2');
                            $worksheet->mergeCells('A3:J3');
                            $worksheet->freezePane('A5');
                            $worksheet->setAutoFilter("A4:J{$highestRow}");
                            $worksheet->setShowGridlines(false);
                            $worksheet->getRowDimension(1)->setRowHeight(30);
                            $worksheet->getRowDimension(2)->setRowHeight(22);
                            $worksheet->getRowDimension(3)->setRowHeight(22);
                            $worksheet->getRowDimension(4)->setRowHeight(30);
                            $worksheet->getStyle('A1:J3')->applyFromArray([
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
                            $worksheet->getStyle('A1:J3')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setVertical(Alignment::VERTICAL_CENTER);
                            $worksheet->getStyle('A4:J4')->applyFromArray([
                                'font' => [
                                    'bold' => true,
                                    'color' => ['rgb' => 'FFFFFF'],
                                ],
                                'fill' => [
                                    'fillType' => Fill::FILL_SOLID,
                                    'startColor' => ['rgb' => '1E293B'],
                                ],
                            ]);
                            $worksheet->getStyle('A4:J4')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
                            $worksheet->getStyle("A4:J{$highestRow}")->applyFromArray([
                                'borders' => [
                                    'allBorders' => [
                                        'borderStyle' => Border::BORDER_THIN,
                                        'color' => ['rgb' => 'D9E2EF'],
                                    ],
                                ],
                            ]);
                            $worksheet->getStyle("A5:J{$highestRow}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
                            $worksheet->getStyle("A5:A{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                            $worksheet->getStyle("F5:G{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                            $worksheet->getStyle("I5:J{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                            $worksheet->getStyle("I5:I{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                            $worksheet->getStyle("J5:J{$highestRow}")->getNumberFormat()->setFormatCode('"Rp" #,##0');
                            $worksheet->getStyle("I5:I{$highestRow}")->getNumberFormat()->setFormatCode('#,##0');

                            for ($row = 5; $row < $totalRow; $row++) {
                                if ($row % 2 === 0) {
                                    $worksheet->getStyle("A{$row}:J{$row}")->applyFromArray([
                                        'fill' => [
                                            'fillType' => Fill::FILL_SOLID,
                                            'startColor' => ['rgb' => 'F8FAFC'],
                                        ],
                                    ]);
                                }

                                $worksheet->getRowDimension($row)->setRowHeight(-1);
                            }

                            $worksheet->getStyle("A{$totalRow}:J{$totalRow}")->applyFromArray([
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
            $this->filename('xlsx'),
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
                'user:id,name',
                'payments' => function ($query): void {
                    $query
                        ->where('status', PaymentStatus::PAID->value)
                        ->orderByDesc('paid_at')
                        ->latest();
                },
            ])
            ->latest()
            ->get();

        $schedules = $this->scheduleMap($bookings);

        return $bookings->map(function (Booking $booking) use ($schedules): array {
            $paidAt = $booking->payments->first()?->paid_at;
            $agentUserId = $booking->agent?->users?->first()?->id;
            $pax = (int) $booking->pax_adult + (int) $booking->pax_child + (int) $booking->pax_infant;
            $departureDate = $this->dateString($booking->departure_date);
            $schedule = $schedules->get($this->scheduleKey((int) $booking->tour_id, $departureDate));
            $commissionAmount = $this->resolveCommissionAmount($booking);

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
                'commission_amount' => $commissionAmount,
                'paid_at' => $paidAt?->toIso8601String(),
            ];
        })->values();
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
            ->when($filters['vendor_id'] && $companyType === 'agent', function (Builder $query) use ($filters): void {
                $query->where('vendor_id', $filters['vendor_id']);
            })
            ->when($filters['tour_code'], function (Builder $query) use ($filters): void {
                $query->whereHas('tour', function (Builder $query) use ($filters): void {
                    $query->where('code', $filters['tour_code']);
                });
            })
            ->when($filters['departure_date'], function (Builder $query) use ($filters): void {
                $query->whereDate('departure_date', $filters['departure_date']);
            })
            ->whereHas('payments', function (Builder $query) use ($filters): void {
                $query
                    ->where('status', PaymentStatus::PAID->value)
                    ->when($filters['period_from'], function (Builder $query) use ($filters): void {
                        $query->whereDate('paid_at', '>=', $filters['period_from']);
                    })
                    ->when($filters['period_to'], function (Builder $query) use ($filters): void {
                        $query->whereDate('paid_at', '<=', $filters['period_to']);
                    });
            });
    }

    private function buildOptions(Company $company, array $filters): array
    {
        $bookings = $this->baseBookingQuery($company, [
            ...$filters,
            'agent_id' => null,
            'vendor_id' => null,
            'tour_code' => null,
            'departure_date' => null,
        ])
            ->with(['agent:id,name', 'vendor:id,name', 'tour:id,name,code'])
            ->get();

        $agents = $this->companyType($company) === 'vendor'
            ? $bookings
                ->filter(fn (Booking $booking): bool => filled($booking->agent_id))
                ->map(fn (Booking $booking): array => [
                    'id' => $booking->agent_id,
                    'name' => $booking->agent?->name ?? 'Unknown Agent',
                ])
                ->unique('id')
                ->sortBy('name')
                ->values()
            : collect();

        $vendors = $this->companyType($company) === 'agent'
            ? $bookings
                ->filter(fn (Booking $booking): bool => filled($booking->vendor_id))
                ->map(fn (Booking $booking): array => [
                    'id' => $booking->vendor_id,
                    'name' => $booking->vendor?->name ?? 'Unknown Vendor',
                ])
                ->unique('id')
                ->sortBy('name')
                ->values()
            : collect();

        $tourCodes = $bookings
            ->filter(fn (Booking $booking): bool => filled($booking->tour?->code))
            ->map(fn (Booking $booking): array => [
                'code' => $booking->tour?->code,
                'name' => $booking->tour?->name,
            ])
            ->unique('code')
            ->sortBy('code')
            ->values();

        $departureDates = filled($filters['tour_code'])
            ? $bookings
                ->filter(fn (Booking $booking): bool => $booking->tour?->code === $filters['tour_code'])
                ->pluck('departure_date')
                ->filter()
                ->map(fn ($date): ?string => $this->dateString($date))
                ->filter()
                ->unique()
                ->sort()
                ->values()
            : collect();

        return [
            'agents' => $agents,
            'vendors' => $vendors,
            'tourCodes' => $tourCodes,
            'departureDates' => $departureDates,
        ];
    }

    private function filters(Request $request): array
    {
        return [
            'period_from' => $request->input('period_from') ?: now()->startOfMonth()->toDateString(),
            'period_to' => $request->input('period_to') ?: now()->endOfMonth()->toDateString(),
            'agent_id' => $request->input('agent_id') ?: null,
            'vendor_id' => $request->input('vendor_id') ?: null,
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

    private function summary(Collection $rows): array
    {
        return [
            'total_records' => $rows->count(),
            'total_pax' => (int) $rows->sum('pax'),
            'total_commission' => (float) $rows->sum('commission_amount'),
        ];
    }

    private function filename(string $extension): string
    {
        return 'Commission_Report_'.now()->format('Y-m-d_His').'.'.$extension;
    }

    private function companyType(Company $company): string
    {
        return strtolower($company->type->value ?? $company->type);
    }
}
