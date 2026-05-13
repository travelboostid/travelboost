<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Company;
use App\Models\Tour;
use App\Models\TourSchedule;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithDrawings;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class RoomListingController extends Controller
{
  public function index(Company $company, Request $request)
  {
    if (strtolower($company->type->value ?? $company->type) !== 'vendor') {
      abort(403, 'Access Denied.');
    }

    $tourId = $request->input('tour_id');
    $departureDate = $request->input('departure_date');

    $toursQuery = Tour::where('company_id', $company->id)
      ->whereHas('bookings', function ($q) use ($company) {
        $q->where('vendor_id', $company->id)
          ->whereIn('status', ['full payment']);
      });

    if ($departureDate) {
      $toursQuery->whereHas('schedules', function ($q) use ($departureDate) {
        $q->whereDate('departure_date', $departureDate);
      });
    }

    $tours = $toursQuery->select('id', 'name', 'code')->get();

    $datesQuery = TourSchedule::whereHas('tour', function ($q) use ($company) {
      $q->where('company_id', $company->id);
    })->whereNotNull('departure_date');

    if ($tourId) {
      $datesQuery->where('tour_id', $tourId);
    }

    $availableDates = $datesQuery->orderBy('departure_date', 'asc')
      ->selectRaw('DATE(departure_date) as date')
      ->distinct()
      ->pluck('date');

    $roomData = [];

    if ($tourId || $departureDate) {
      $bookingsQuery = Booking::where('vendor_id', $company->id)
        ->whereIn('status', ['full payment'])
        ->with(['passengers', 'agent:id,name']);

      if ($tourId) {
        $bookingsQuery->where('tour_id', $tourId);
      }
      if ($departureDate) {
        $bookingsQuery->whereDate('departure_date', $departureDate);
      }

      $bookings = $bookingsQuery->orderBy('booking_number', 'asc')->get();

      foreach ($bookings as $booking) {
        $passengers = $booking->passengers->sortBy('room_type')->values();

        foreach ($passengers as $pax) {
          $roomData[] = [
            'booking_number' => $booking->booking_number,
            'agent_name' => $booking->agent ? $booking->agent->name : 'Direct',
            'contact_phone' => $booking->contact_phone,
            'contact_notes' => $booking->contact_notes,
            'title' => $pax->title,
            'first_name' => $pax->first_name,
            'last_name' => $pax->last_name,
            'gender' => $pax->gender,
            'dob' => $pax->dob ? (is_string($pax->dob) ? explode('T', $pax->dob)[0] : $pax->dob->format('Y-m-d')) : null,
            'pob' => $pax->pob,
            'passport_number' => $pax->passport_number,
            'passport_issue_date' => $pax->passport_issue_date ? (is_string($pax->passport_issue_date) ? explode('T', $pax->passport_issue_date)[0] : $pax->passport_issue_date->format('Y-m-d')) : null,
            'passport_expiry_date' => $pax->passport_expiry_date ? (is_string($pax->passport_expiry_date) ? explode('T', $pax->passport_expiry_date)[0] : $pax->passport_expiry_date->format('Y-m-d')) : null,
            'room_type' => $pax->room_type,
            'price_category' => $pax->price_category,
            'visa_number' => $pax->visa_number,
          ];
        }
      }
    }

    return Inertia::render('companies/dashboard/reports/room-listings/index', [
      'tours' => $tours,
      'availableDates' => $availableDates,
      'roomData' => $roomData,
      'filters' => [
        'tour_id' => $tourId,
        'departure_date' => $departureDate,
      ]
    ]);
  }

  public function exportPdf(Company $company, Request $request)
  {
    $data = $this->getExportData($company, $request);
    $data['isExcel'] = false;

    $filename = $this->generateFilename($data['tour'], $data['departure_date'], 'pdf');

    $pdf = Pdf::setOption(['isRemoteEnabled' => true])
      ->loadView('exports.rooming-list', $data)
      ->setPaper('A4', 'landscape');

    return $pdf->stream($filename);
  }

  public function exportExcel(Company $company, Request $request)
  {
    $data = $this->getExportData($company, $request);
    $data['isExcel'] = true;

    $filename = $this->generateFilename($data['tour'], $data['departure_date'], 'xlsx');

    return Excel::download(new class($data) implements FromView, ShouldAutoSize, WithColumnWidths, WithStyles, WithDrawings {
      private $data;
      public function __construct($data)
      {
        $this->data = $data;
      }
      public function view(): View
      {
        return view('exports.rooming-list', $this->data);
      }

      public function drawings()
      {
        $drawings = [];
        $company = $this->data['company'];

        if ($company->photo_url) {
          $path = public_path($company->photo_url);
          if (file_exists($path)) {
            $drawing = new Drawing();
            $drawing->setName('Logo');
            $drawing->setDescription('Vendor Logo');
            $drawing->setPath($path);
            $drawing->setHeight(60);
            $drawing->setCoordinates('A1');
            $drawing->setOffsetX(5);
            $drawing->setOffsetY(10);
            $drawings[] = $drawing;
          }
        }
        return $drawings;
      }

      public function columnWidths(): array
      {
        return [
          'A' => 4,
          'B' => 26,
          'C' => 15,
          'D' => 7,
          'E' => 7,
          'F' => 6,
          'G' => 22,
          'H' => 16,
          'I' => 12,
          'J' => 12,
          'K' => 12,
          'L' => 12,
          'M' => 12,
          'N' => 18,
          'O' => 5,
          'P' => 5,
        ];
      }

      public function styles(Worksheet $sheet)
      {
        $sheet->getStyle($sheet->calculateWorksheetDimension())->getAlignment()->setWrapText(true);
        $sheet->getStyle($sheet->calculateWorksheetDimension())->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

        $sheet->getDefaultRowDimension()->setRowHeight(25);
        $sheet->getRowDimension(1)->setRowHeight(30);
        $sheet->getRowDimension(2)->setRowHeight(30);
        $sheet->getRowDimension(3)->setRowHeight(15);

        return [];
      }
    }, $filename);
  }

  private function generateFilename($tour, $departureDate, $extension)
  {
    $tourCode = $tour ? $tour->code . '_' : '';
    $date = $departureDate ? $departureDate . '_' : 'AllDates_';
    $today = now()->format('Y-m-d');
    return "Rooming_List_{$tourCode}{$date}{$today}.{$extension}";
  }

  private function getExportData(Company $company, Request $request)
  {
    $tourId = $request->input('tour_id');
    $departureDate = $request->input('departure_date');
    $tour = $tourId ? Tour::find($tourId) : null;

    $bookings = Booking::where('vendor_id', $company->id)
      ->whereIn('status', ['full payment'])
      ->with(['passengers'])
      ->when($tourId, fn($q) => $q->where('tour_id', $tourId))
      ->when($departureDate, fn($q) => $q->whereDate('departure_date', $departureDate))
      ->orderBy('booking_number', 'asc')
      ->get();

    $groupedData = [];
    foreach ($bookings as $booking) {
      $rooms = $booking->passengers->sortBy('room_type')->groupBy('room_type');
      $groupedData[$booking->booking_number] = [
        'contact_phone' => $booking->contact_phone,
        'rooms' => $rooms,
        'total_pax' => $booking->passengers->count()
      ];
    }

    return [
      'company' => $company,
      'tour' => $tour,
      'departure_date' => $departureDate,
      'groupedData' => $groupedData
    ];
  }
}
