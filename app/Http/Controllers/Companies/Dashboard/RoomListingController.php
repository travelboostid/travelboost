<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Company;
use App\Models\Tour;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithDrawings;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Events\AfterSheet;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Worksheet\PageSetup;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class RoomListingController extends Controller
{
    public function index(Company $company, Request $request): Response
    {
        $this->ensureVendorAccess($company);

        $tourId = $request->input('tour_id');
        $departureDate = $request->input('departure_date');
        $hasCompleteFilters = filled($tourId) && filled($departureDate);

        $tours = Tour::query()
            ->where('company_id', $company->id)
            ->whereHas('bookings', function ($query) use ($company): void {
                $query->where('vendor_id', $company->id)
                    ->whereIn('status', ['full payment']);
            })
            ->select('id', 'name', 'code')
            ->orderBy('code')
            ->get();

        $availableDates = collect();

        if (filled($tourId)) {
            $availableDates = Booking::query()
                ->where('vendor_id', $company->id)
                ->where('tour_id', $tourId)
                ->whereIn('status', ['full payment'])
                ->whereNotNull('departure_date')
                ->orderBy('departure_date')
                ->selectRaw('DATE(departure_date) as date')
                ->distinct()
                ->pluck('date');
        }

        $roomData = $hasCompleteFilters
          ? $this->buildRoomData($company, $tourId, $departureDate)
          : [];

        return Inertia::render('companies/dashboard/reports/room-listings/index', [
            'tours' => $tours,
            'availableDates' => $availableDates,
            'roomData' => $roomData,
            'filters' => [
                'tour_id' => $tourId,
                'departure_date' => $departureDate,
            ],
        ]);
    }

    public function exportPdf(Company $company, Request $request)
    {
        $data = $this->getExportData($company, $request);
        $data['isExcel'] = false;

        $filename = $this->generateFilename(
            $data['tour'],
            $data['departure_date'],
            'pdf',
        );

        $pdf = Pdf::setOption(['isRemoteEnabled' => true])
            ->loadView('exports.room-listing', $data)
            ->setPaper('A4', 'landscape');

        return $pdf->stream($filename);
    }

    public function exportExcel(Company $company, Request $request)
    {
        $data = $this->getExportData($company, $request);
        $data['isExcel'] = true;

        $filename = $this->generateFilename(
            $data['tour'],
            $data['departure_date'],
            'xlsx',
        );

        return Excel::download(
            new class($data) implements FromView, ShouldAutoSize, WithColumnWidths, WithDrawings, WithEvents, WithStyles
            {
                private array $data;

                public function __construct(array $data)
                {
                    $this->data = $data;
                }

                public function view(): View
                {
                    return view('exports.room-listing', $this->data);
                }

                public function drawings(): array
                {
                    $drawings = [];
                    $company = $this->data['company'];

                    if ($company->photo_url) {
                        $path = public_path($company->photo_url);

                        if (file_exists($path)) {
                            $drawing = new Drawing;
                            $drawing->setName('Logo');
                            $drawing->setDescription('Vendor Logo');
                            $drawing->setPath($path);
                            $drawing->setHeight(52);
                            $drawing->setCoordinates('A1');
                            $drawing->setOffsetX(8);
                            $drawing->setOffsetY(8);
                            $drawings[] = $drawing;
                        }
                    }

                    return $drawings;
                }

                public function columnWidths(): array
                {
                    return [
                        'A' => 5,
                        'B' => 28,
                        'C' => 12,
                        'D' => 8,
                        'E' => 8,
                        'F' => 7,
                        'G' => 24,
                        'H' => 16,
                        'I' => 13,
                        'J' => 13,
                        'K' => 16,
                        'L' => 13,
                        'M' => 14,
                        'N' => 6,
                        'O' => 6,
                    ];
                }

                public function styles(Worksheet $sheet): array
                {
                    $dimension = $sheet->calculateWorksheetDimension();

                    $sheet->getStyle($dimension)
                        ->getAlignment()
                        ->setWrapText(true);

                    $sheet->getStyle($dimension)
                        ->getAlignment()
                        ->setVertical(Alignment::VERTICAL_CENTER);

                    $sheet->getStyle('A1:O4')->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_LEFT)
                        ->setVertical(Alignment::VERTICAL_CENTER);

                    $sheet->getStyle('A6:O6')->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_CENTER)
                        ->setVertical(Alignment::VERTICAL_CENTER);

                    $sheet->getStyle('A6:O6')->getFill()
                        ->setFillType(Fill::FILL_SOLID)
                        ->getStartColor()
                        ->setRGB('EAF2FF');

                    $sheet->getStyle('A6:O6')->getBorders()->getAllBorders()
                        ->setBorderStyle(Border::BORDER_THIN)
                        ->getColor()
                        ->setRGB('B8C7D9');

                    $sheet->getStyle('A1:O3')->getFill()
                        ->setFillType(Fill::FILL_SOLID)
                        ->getStartColor()
                        ->setRGB('FFFFFF');

                    $highestRow = max(7, $sheet->getHighestRow());

                    $sheet->getStyle('A7:O'.$highestRow)->getBorders()->getAllBorders()
                        ->setBorderStyle(Border::BORDER_THIN)
                        ->getColor()
                        ->setRGB('D8E1EC');

                    $sheet->getDefaultRowDimension()->setRowHeight(-1);
                    $sheet->getRowDimension(1)->setRowHeight(34);
                    $sheet->getRowDimension(2)->setRowHeight(30);
                    $sheet->getRowDimension(3)->setRowHeight(20);
                    $sheet->getRowDimension(4)->setRowHeight(12);
                    $sheet->getRowDimension(6)->setRowHeight(24);
                    $sheet->freezePane('A7');
                    $sheet->getPageSetup()
                        ->setOrientation(PageSetup::ORIENTATION_LANDSCAPE)
                        ->setFitToWidth(1)
                        ->setFitToHeight(0);
                    $sheet->getPageMargins()
                        ->setTop(0.35)
                        ->setRight(0.25)
                        ->setLeft(0.25)
                        ->setBottom(0.35);

                    return [];
                }

                public function registerEvents(): array
                {
                    return [
                        AfterSheet::class => function (AfterSheet $event): void {
                            $worksheet = $event->sheet->getDelegate();
                            $highestRow = $worksheet->getHighestRow();

                            $worksheet->getStyle('C1:I2')->getFont()
                                ->setBold(true)
                                ->setSize(18)
                                ->getColor()
                                ->setRGB('0F172A');

                            $worksheet->getStyle('J1:K2')->getFont()
                                ->setBold(true)
                                ->setSize(8)
                                ->getColor()
                                ->setRGB('64748B');

                            $worksheet->getStyle('L1:O2')->getFont()
                                ->setBold(true)
                                ->setSize(10)
                                ->getColor()
                                ->setRGB('0F172A');

                            $worksheet->getStyle('C3:I3')->getFont()
                                ->setBold(true)
                                ->setSize(10)
                                ->getColor()
                                ->setRGB('334155');

                            $worksheet->getStyle('A1:O4')->getBorders()->getBottom()
                                ->setBorderStyle(Border::BORDER_MEDIUM)
                                ->getColor()
                                ->setRGB('0F172A');

                            for ($row = 6; $row <= $highestRow; $row++) {
                                $worksheet->getRowDimension($row)->setRowHeight(-1);
                            }
                        },
                    ];
                }
            },
            $filename,
        );
    }

    private function generateFilename($tour, ?string $departureDate, string $extension): string
    {
        $tourCode = $tour ? $tour->code.'_' : '';
        $date = $departureDate ? $departureDate.'_' : 'NoDate_';
        $today = now()->format('Y-m-d');

        return "Room_Listing_{$tourCode}{$date}{$today}.{$extension}";
    }

    private function getExportData(Company $company, Request $request): array
    {
        $this->ensureVendorAccess($company);

        $tourId = $request->input('tour_id');
        $departureDate = $request->input('departure_date');

        abort_unless(filled($tourId) && filled($departureDate), 422);

        $tour = Tour::query()
            ->where('company_id', $company->id)
            ->findOrFail($tourId);

        $bookings = Booking::query()
            ->where('vendor_id', $company->id)
            ->whereIn('status', ['full payment'])
            ->with('passengers')
            ->where('tour_id', $tourId)
            ->whereDate('departure_date', $departureDate)
            ->orderBy('booking_number')
            ->get();

        $groupedData = [];

        foreach ($bookings as $booking) {
            $rooms = $booking->passengers
                ->sortBy(function ($passenger) {
                    return [$passenger->room_type, $passenger->first_name];
                })
                ->groupBy(fn ($passenger) => $passenger->room_type ?: 'TBA');

            $groupedData[$booking->booking_number] = [
                'contact_phone' => $booking->contact_phone,
                'contact_notes' => $booking->contact_notes,
                'rooms' => $rooms,
                'total_pax' => $booking->passengers->count(),
            ];
        }

        return [
            'company' => $company,
            'tour' => $tour,
            'departure_date' => $departureDate,
            'groupedData' => $groupedData,
        ];
    }

    private function buildRoomData(
        Company $company,
        string $tourId,
        string $departureDate,
    ): array {
        $bookings = Booking::query()
            ->where('vendor_id', $company->id)
            ->whereIn('status', ['full payment'])
            ->with(['passengers', 'agent:id,name'])
            ->where('tour_id', $tourId)
            ->whereDate('departure_date', $departureDate)
            ->orderBy('booking_number')
            ->get();

        $roomData = [];

        foreach ($bookings as $booking) {
            $passengers = $booking->passengers
                ->sortBy(function ($passenger) {
                    return [$passenger->room_type, $passenger->first_name];
                })
                ->values();

            foreach ($passengers as $passenger) {
                $roomData[] = [
                    'booking_number' => $booking->booking_number,
                    'agent_name' => $booking->agent ? $booking->agent->name : 'Direct',
                    'contact_phone' => $booking->contact_phone,
                    'contact_notes' => $booking->contact_notes,
                    'title' => $passenger->title,
                    'first_name' => $passenger->first_name,
                    'last_name' => $passenger->last_name,
                    'gender' => $passenger->gender,
                    'dob' => $passenger->dob ? $passenger->dob->format('Y-m-d') : null,
                    'pob' => $passenger->pob,
                    'passport_number' => $passenger->passport_number,
                    'passport_issue_date' => $passenger->passport_issue_date
                      ? $passenger->passport_issue_date->format('Y-m-d')
                      : null,
                    'passport_expiry_date' => $passenger->passport_expiry_date
                      ? $passenger->passport_expiry_date->format('Y-m-d')
                      : null,
                    'room_type' => $passenger->room_type ?: 'TBA',
                    'room_number' => $passenger->room_number,
                    'price_category' => $passenger->price_category,
                    'visa_number' => $passenger->visa_number,
                    'note' => $passenger->note,
                ];
            }
        }

        return $roomData;
    }

    private function ensureVendorAccess(Company $company): void
    {
        if (strtolower($company->type->value ?? $company->type) !== 'vendor') {
            abort(403, 'Access Denied.');
        }
    }
}
