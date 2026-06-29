<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Company;
use App\Models\Tour;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
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
                    ->whereIn('status', [
                        BookingStatus::DOWN_PAYMENT->value,
                        BookingStatus::FULL_PAYMENT->value,
                    ]);
            })
            ->select('id', 'name', 'code')
            ->orderBy('code')
            ->get();

        $availableDates = collect();

        if (filled($tourId)) {
            $availableDates = Booking::query()
                ->where('vendor_id', $company->id)
                ->where('tour_id', $tourId)
                ->whereIn('status', [
                    BookingStatus::DOWN_PAYMENT->value,
                    BookingStatus::FULL_PAYMENT->value,
                ])
                ->whereNotNull('departure_date')
                ->orderBy('departure_date')
                ->selectRaw('DATE(departure_date) as date')
                ->distinct()
                ->pluck('date');
        }

        $agentGroups = $hasCompleteFilters
            ? $this->buildAgentGroups($this->roomListingBookings($company, $tourId, $departureDate))
            : [];

        $roomData = $hasCompleteFilters
            ? $this->flattenRoomData($agentGroups)
            : [];
        $roomRecap = $hasCompleteFilters
            ? $this->buildRoomRecap($agentGroups)
            : [];

        return Inertia::render('companies/dashboard/reports/room-listings/index', [
            'tours' => $tours,
            'availableDates' => $availableDates,
            'roomData' => $roomData,
            'agentGroups' => $agentGroups,
            'roomRecap' => $roomRecap,
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
                    $logoPath = app(RoomListingController::class)->resolveCompanyLogoPath($company->photo_url);

                    if ($logoPath !== null) {
                        $drawing = new Drawing;
                        $drawing->setName('Logo');
                        $drawing->setDescription('Vendor Logo');
                        $drawing->setPath($logoPath);
                        $drawing->setHeight(52);
                        $drawing->setCoordinates('A1');
                        $drawing->setOffsetX(8);
                        $drawing->setOffsetY(8);
                        $drawings[] = $drawing;
                    }

                    return $drawings;
                }

                public function columnWidths(): array
                {
                    return [
                        'A' => 5,
                        'B' => 9,
                        'C' => 24,
                        'D' => 14,
                        'E' => 12,
                        'F' => 8,
                        'G' => 8,
                        'H' => 8,
                        'I' => 7,
                        'J' => 22,
                        'K' => 16,
                        'L' => 16,
                        'M' => 13,
                        'N' => 13,
                        'O' => 16,
                        'P' => 13,
                        'Q' => 14,
                        'R' => 12,
                        'S' => 18,
                        'T' => 6,
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

                    $sheet->getStyle('A1:T4')->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_LEFT)
                        ->setVertical(Alignment::VERTICAL_CENTER);

                    $sheet->getStyle('A6:T6')->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_CENTER)
                        ->setVertical(Alignment::VERTICAL_CENTER);

                    $sheet->getStyle('A6:T6')->getFill()
                        ->setFillType(Fill::FILL_SOLID)
                        ->getStartColor()
                        ->setRGB('EAF2FF');

                    $sheet->getStyle('A6:T6')->getBorders()->getAllBorders()
                        ->setBorderStyle(Border::BORDER_THIN)
                        ->getColor()
                        ->setRGB('B8C7D9');

                    $sheet->getStyle('A1:T3')->getFill()
                        ->setFillType(Fill::FILL_SOLID)
                        ->getStartColor()
                        ->setRGB('FFFFFF');

                    $highestRow = max(7, $sheet->getHighestRow());

                    $sheet->getStyle('A7:T'.$highestRow)->getBorders()->getAllBorders()
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

                            $worksheet->getStyle('L1:T2')->getFont()
                                ->setBold(true)
                                ->setSize(10)
                                ->getColor()
                                ->setRGB('0F172A');

                            $worksheet->getStyle('C3:I3')->getFont()
                                ->setBold(true)
                                ->setSize(10)
                                ->getColor()
                                ->setRGB('334155');

                            $worksheet->getStyle('A1:T4')->getBorders()->getBottom()
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

    public function exportDocuments(Company $company, Request $request)
    {
        $this->ensureVendorAccess($company);

        $tourId = $request->input('tour_id');
        $departureDate = $request->input('departure_date');

        abort_unless(filled($tourId) && filled($departureDate), 422);

        $tour = Tour::query()
            ->where('company_id', $company->id)
            ->findOrFail($tourId);

        $bookings = $this->roomListingBookings($company, $tourId, $departureDate);

        $zipFile = tempnam(sys_get_temp_dir(), 'docs');
        $zip = new \ZipArchive;
        $zip->open($zipFile, \ZipArchive::CREATE | \ZipArchive::OVERWRITE);

        $hasFiles = false;

        $zip->addEmptyDir('passport');
        $zip->addEmptyDir('visa');

        foreach ($bookings as $booking) {
            foreach ($booking->passengers as $passenger) {
                $name = preg_replace('/[^A-Za-z0-9\-]/', '_', trim($passenger->first_name.' '.$passenger->last_name));
                $name = trim($name, '_');

                if ($passenger->passport_file_path && \Storage::disk('public')->exists($passenger->passport_file_path)) {
                    $ext = pathinfo($passenger->passport_file_path, PATHINFO_EXTENSION) ?: 'pdf';
                    $filename = "passport/{$name}_passport.{$ext}";
                    $zip->addFile(\Storage::disk('public')->path($passenger->passport_file_path), $filename);
                    $hasFiles = true;
                }

                if ($passenger->visa_file_path && \Storage::disk('public')->exists($passenger->visa_file_path)) {
                    $ext = pathinfo($passenger->visa_file_path, PATHINFO_EXTENSION) ?: 'pdf';
                    $filename = "visa/{$name}_visa.{$ext}";
                    $zip->addFile(\Storage::disk('public')->path($passenger->visa_file_path), $filename);
                    $hasFiles = true;
                }
            }
        }

        $zip->close();

        if (! $hasFiles) {
            unlink($zipFile);

            return back()->with('error', 'No documents found for the selected passengers.');
        }

        $filename = $this->generateFilename($tour, $departureDate, 'zip');

        return response()->download($zipFile, $filename)->deleteFileAfterSend(true);
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

        $agentGroups = $this->buildAgentGroups(
            $this->roomListingBookings($company, $tourId, $departureDate)
        );

        return [
            'company' => $company,
            'tour' => $tour,
            'departure_date' => $departureDate,
            'groupedData' => $agentGroups,
            'roomRecap' => $this->buildRoomRecap($agentGroups),
            'companyLogoPath' => $this->resolveCompanyLogoPath($company->photo_url),
        ];
    }

    private function roomListingBookings(
        Company $company,
        string $tourId,
        string $departureDate,
    ) {
        return Booking::query()
            ->where('vendor_id', $company->id)
            ->whereIn('status', [
                BookingStatus::DOWN_PAYMENT->value,
                BookingStatus::FULL_PAYMENT->value,
            ])
            ->with(['passengers', 'rooms', 'agent:id,name'])
            ->where('tour_id', $tourId)
            ->whereDate('departure_date', $departureDate)
            ->orderBy('created_at')
            ->orderBy('id')
            ->get();
    }

    private function buildAgentGroups($bookings): array
    {
        $agentGroups = [];
        $globalRoomNumber = 0;

        foreach ($bookings as $booking) {
            $agentName = $booking->agent?->name ?: 'Direct';

            if (! isset($agentGroups[$agentName])) {
                $agentGroups[$agentName] = [
                    'agent_name' => $agentName,
                    'bookings' => [],
                ];
            }

            $rooms = collect($this->buildRoomGroups($booking->passengers, $booking->rooms))
                ->map(function (array $roomGroup) use (&$globalRoomNumber): array {
                    $roomGroup['room_number'] = (string) (++$globalRoomNumber);

                    return $roomGroup;
                })
                ->all();

            $agentGroups[$agentName]['bookings'][] = [
                'booking_id' => $booking->id,
                'booking_number' => $booking->booking_number,
                'payment_status' => $booking->status instanceof BookingStatus
                    ? $booking->status->value
                    : (string) $booking->status,
                'contact_phone' => $booking->contact_phone,
                'contact_notes' => $booking->contact_notes,
                'rooms' => $rooms,
                'total_pax' => $booking->passengers->count(),
            ];
        }

        return array_values($agentGroups);
    }

    private function flattenRoomData(array $agentGroups): array
    {
        $roomData = [];

        foreach ($agentGroups as $agentGroup) {
            foreach ($agentGroup['bookings'] as $bookingData) {
                foreach ($bookingData['rooms'] as $roomIndex => $roomGroup) {
                    $passengers = collect($roomGroup['passengers'] ?? [])->values();

                    foreach ($passengers as $passenger) {
                        $roomData[] = [
                            'booking_number' => $bookingData['booking_number'],
                            'payment_status' => $bookingData['payment_status'],
                            'agent_name' => $agentGroup['agent_name'],
                            'contact_phone' => $bookingData['contact_phone'],
                            'contact_notes' => $bookingData['contact_notes'],
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
                            'room_type' => $roomGroup['room_type'],
                            'room_type_note' => $roomGroup['room_type_note'] ?? null,
                            'room_type_note_labels' => $roomGroup['room_type_note_labels'] ?? [],
                            'room_capacity' => max(1, (int) ($roomGroup['room_capacity'] ?? $passengers->count())),
                            'room_number' => $roomGroup['room_number'],
                            'room_group_key' => $roomGroup['room_key'] ?? "room-{$roomIndex}",
                            'sharing_note' => $roomGroup['sharing_note'] ?? null,
                            'price_category' => $passenger->price_category,
                            'visa_number' => $passenger->visa_number,
                            'visa_type_description' => $passenger->visa_type_description,
                            'note' => $passenger->note,
                        ];
                    }
                }
            }
        }

        return $roomData;
    }

    private function buildRoomGroups($passengers, $rooms = null): array
    {
        $passengers = collect($passengers)->values();
        $roomGroups = $this->buildRoomGroupsFromArrangements($passengers, $rooms);

        if ($roomGroups === []) {
            $roomGroups = $this->buildRoomGroupsFromPassengerRoomNumbers($passengers);
        }

        if ($roomGroups === []) {
            return $this->buildFallbackRoomGroups($passengers);
        }

        $assignedPassengerIds = collect($roomGroups)
            ->flatMap(fn (array $roomGroup) => collect($roomGroup['passengers'])->pluck('id'))
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->all();

        $remainingPassengers = $passengers
            ->reject(fn ($passenger) => in_array((int) $passenger->id, $assignedPassengerIds, true))
            ->values();

        if ($remainingPassengers->isNotEmpty()) {
            return array_merge($roomGroups, $this->buildFallbackRoomGroups($remainingPassengers));
        }

        return $roomGroups;
    }

    private function buildRoomGroupsFromArrangements($passengers, $rooms): array
    {
        $roomGroups = [];
        $passengersById = $passengers->keyBy(fn ($passenger) => (string) $passenger->id);
        $assignedPassengerIds = [];

        collect($rooms)
            ->values()
            ->each(function ($room, int $roomIndex) use (&$roomGroups, $passengersById, &$assignedPassengerIds): void {
                $bedLayout = collect($room->bed_layout ?? [])
                    ->sortBy(fn ($bed, int $index) => (int) data_get($bed, 'position.x', $index))
                    ->values();

                $guestIds = $bedLayout
                    ->map(fn ($bed) => data_get($bed, 'guestId'))
                    ->filter(fn ($guestId) => filled($guestId))
                    ->map(fn ($guestId) => (string) $guestId)
                    ->unique()
                    ->values();

                if ($guestIds->isEmpty()) {
                    return;
                }

                $roomPassengers = $guestIds
                    ->map(fn (string $guestId) => $passengersById->get($guestId))
                    ->filter()
                    ->values();

                if ($roomPassengers->isEmpty()) {
                    return;
                }

                $roomNumber = $this->roomNumberFromLabel($room->room_label, $roomIndex + 1);

                $sharingPassengers = $passengersById
                    ->filter(function ($passenger) use ($roomNumber, $guestIds, $assignedPassengerIds): bool {
                        return $this->isSharingCategory($passenger->price_category)
                            && ! in_array((int) $passenger->id, $assignedPassengerIds, true)
                            && (string) ($passenger->room_number ?? '') === $roomNumber
                            && ! $guestIds->contains((string) $passenger->id);
                    })
                    ->sortBy(fn ($passenger) => $passenger->first_name.' '.$passenger->last_name)
                    ->values();

                $orderedPassengers = $roomPassengers
                    ->concat($sharingPassengers)
                    ->values();

                foreach ($orderedPassengers as $passenger) {
                    $assignedPassengerIds[] = (int) $passenger->id;
                }

                $roomGroups[] = [
                    'room_type' => $this->normalizeRoomType($room->room_type ?: $roomPassengers->first()?->room_type),
                    'room_number' => $roomNumber,
                    'room_key' => "arrangement-{$roomIndex}",
                    'room_capacity' => max(1, $roomPassengers->count()),
                    'sharing_note' => $sharingPassengers->isNotEmpty() ? 'sharing' : null,
                    'room_type_note' => $this->roomTypeNote($orderedPassengers),
                    'room_type_note_labels' => $this->roomTypeNoteLabels($orderedPassengers),
                    'passengers' => $orderedPassengers,
                ];
            });

        return $roomGroups;
    }

    private function buildRoomGroupsFromPassengerRoomNumbers($passengers): array
    {
        return $passengers
            ->filter(fn ($passenger) => filled($passenger->room_number))
            ->groupBy(fn ($passenger) => (string) $passenger->room_number)
            ->map(function (Collection $roomPassengers, string $roomNumber): array {
                $bedPassengers = $roomPassengers
                    ->reject(fn ($passenger) => $this->isSharingCategory($passenger->price_category))
                    ->values();

                $sharingPassengers = $roomPassengers
                    ->filter(fn ($passenger) => $this->isSharingCategory($passenger->price_category))
                    ->values();

                $orderedPassengers = $bedPassengers->concat($sharingPassengers)->values();
                $seedPassenger = $bedPassengers->first() ?: $roomPassengers->first();

                return [
                    'room_type' => $this->normalizeRoomType($seedPassenger?->room_type),
                    'room_number' => $roomNumber,
                    'room_key' => "passenger-room-{$roomNumber}",
                    'room_capacity' => max(1, $bedPassengers->count()),
                    'sharing_note' => $sharingPassengers->isNotEmpty() ? 'sharing' : null,
                    'room_type_note' => $this->roomTypeNote($orderedPassengers),
                    'room_type_note_labels' => $this->roomTypeNoteLabels($orderedPassengers),
                    'passengers' => $orderedPassengers,
                ];
            })
            ->sortBy(fn (array $roomGroup) => (int) preg_replace('/\D+/', '', (string) $roomGroup['room_number']))
            ->values()
            ->all();
    }

    private function buildFallbackRoomGroups($passengers): array
    {
        $roomGroups = [];

        $bedPassengers = $passengers
            ->reject(fn ($passenger) => $this->isSharingCategory($passenger->price_category))
            ->values();

        $bedPassengers
            ->sortBy(function ($passenger) {
                return [$this->normalizeRoomType($passenger->room_type), $passenger->first_name];
            })
            ->groupBy(fn ($passenger) => $this->normalizeRoomType($passenger->room_type))
            ->each(function ($roomPassengers, string $roomType) use (&$roomGroups): void {
                $capacity = max(1, $this->roomCapacity($roomPassengers->first()?->room_type));

                $roomPassengers
                    ->values()
                    ->chunk($capacity)
                    ->each(function ($chunk, int $chunkIndex) use (&$roomGroups, $roomType): void {
                        $roomGroups[] = [
                            'room_type' => $roomType,
                            'room_key' => "fallback-{$roomType}-{$chunkIndex}",
                            'room_capacity' => max(1, $chunk->count()),
                            'sharing_note' => null,
                            'room_type_note' => $this->roomTypeNote($chunk),
                            'room_type_note_labels' => $this->roomTypeNoteLabels($chunk),
                            'passengers' => $chunk,
                        ];
                    });
            });

        return $roomGroups;
    }

    private function roomNumberFromLabel(?string $roomLabel, int $fallback): string
    {
        $label = trim((string) $roomLabel);

        if ($label === '') {
            return (string) $fallback;
        }

        if (preg_match('/\d+/', $label, $matches)) {
            return $matches[0];
        }

        return $label;
    }

    private function normalizeRoomType(?string $roomType): string
    {
        $normalized = trim((string) preg_replace('/\s*\([^)]*\)/', '', $roomType ?? ''));

        return match (strtolower($normalized)) {
            'single' => 'Single Room',
            'single_extra_bed' => 'Single Room',
            'twin' => 'Twin Room',
            'twin_extra_bed' => 'Twin Room',
            'double' => 'Double Room',
            'double_extra_bed' => 'Double Room',
            'extra_bed' => 'Double Room',
            'triple' => 'Triple Room',
            'quad' => 'Quad Room',
            default => $normalized !== '' ? $normalized : 'TBA',
        };
    }

    private function roomCapacity(?string $roomType): int
    {
        $roomTypeValue = strtolower((string) $roomType);

        if (preg_match('/\((\d+)\s*(?:person|persons|pax)?\)/i', $roomTypeValue, $matches)) {
            return max(1, (int) $matches[1]);
        }

        return match (true) {
            str_contains($roomTypeValue, 'quad') => 4,
            str_contains($roomTypeValue, 'triple') => 3,
            str_contains($roomTypeValue, 'twin'), str_contains($roomTypeValue, 'double') => 2,
            default => 1,
        };
    }

    private function isSharingCategory(?string $priceCategory): bool
    {
        $normalized = strtolower(trim((string) $priceCategory));

        return in_array($normalized, [
            'child no bed',
            'infant',
        ], true);
    }

    private function isSupplementCategory(?string $priceCategory): bool
    {
        $normalized = strtolower(trim((string) $priceCategory));

        if ($normalized === '') {
            return false;
        }

        return str_contains($normalized, 'no bed')
            || str_contains($normalized, 'with bed')
            || str_contains($normalized, 'extra bed')
            || str_contains($normalized, 'infant');
    }

    private function normalizeSupplementLabel(?string $priceCategory): ?string
    {
        $normalized = trim((string) $priceCategory);

        if ($normalized === '') {
            return null;
        }

        return collect(preg_split('/\s+/', strtolower($normalized)) ?: [])
            ->filter()
            ->map(fn (string $segment) => ucfirst($segment))
            ->implode(' ');
    }

    private function roomTypeNote($passengers): ?string
    {
        $labels = $this->roomTypeNoteLabels($passengers);

        if ($labels === []) {
            return null;
        }

        return '+ '.implode(', ', $labels);
    }

    private function roomTypeNoteLabels($passengers): array
    {
        return collect($passengers)
            ->map(function ($passenger): ?string {
                $priceCategory = $passenger->price_category ?? null;

                if (! $this->isSupplementCategory($priceCategory)) {
                    return null;
                }

                return $this->normalizeSupplementLabel($priceCategory);
            })
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    private function buildRoomRecap(array $agentGroups): array
    {
        $roomRecap = [];
        $supplementRecap = [];

        foreach ($agentGroups as $agentGroup) {
            foreach ($agentGroup['bookings'] as $bookingData) {
                foreach ($bookingData['rooms'] as $roomGroup) {
                    $roomType = $roomGroup['room_type'];
                    $roomRecap[$roomType] = ($roomRecap[$roomType] ?? 0) + 1;

                    foreach (($roomGroup['passengers'] ?? []) as $passenger) {
                        $priceCategory = $passenger->price_category ?? null;

                        if (! $this->isSupplementCategory($priceCategory)) {
                            continue;
                        }

                        $label = $this->normalizeSupplementLabel($priceCategory);

                        if ($label === null) {
                            continue;
                        }

                        $supplementRecap[$label] = ($supplementRecap[$label] ?? 0) + 1;
                    }
                }
            }
        }

        ksort($roomRecap);
        ksort($supplementRecap);

        return collect($roomRecap)
            ->map(fn (int $count, string $roomType): array => [
                'roomType' => $roomType,
                'count' => $count,
                'unit' => $count === 1 ? 'room' : 'rooms',
            ])
            ->concat(
                collect($supplementRecap)->map(fn (int $count, string $label): array => [
                    'roomType' => $label,
                    'count' => $count,
                    'unit' => 'pax',
                ])
            )
            ->values()
            ->all();
    }

    public function resolveCompanyLogoPath(?string $photoUrl): ?string
    {
        $path = trim((string) $photoUrl);

        if ($path === '') {
            return null;
        }

        $parsedPath = parse_url($path, PHP_URL_PATH);
        $relativePath = ltrim((string) ($parsedPath ?: $path), '/');
        $resolvedPath = public_path(str_replace('/', DIRECTORY_SEPARATOR, $relativePath));

        return file_exists($resolvedPath) ? $resolvedPath : null;
    }

    private function ensureVendorAccess(Company $company): void
    {
        if (strtolower($company->type->value ?? $company->type) !== 'vendor') {
            abort(403, 'Access Denied.');
        }
    }
}
