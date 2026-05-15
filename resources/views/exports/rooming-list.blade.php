<!DOCTYPE html>
<html>

<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <title>Rooming List</title>
  @if(!$isExcel)
  <style>
    @page {
      margin: 25px;
    }

    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      font-size: 7.5pt;
      color: #000;
      margin: 0;
      padding: 0;
    }

    .logo {
      max-height: 40px;
      width: auto;
      margin-bottom: 5px;
    }
  </style>
  @endif
</head>

<body style="{{ $isExcel ? 'font-family: Arial, sans-serif; font-size: 10px;' : '' }}">

  @if($isExcel)
  <table style="width: 100%;">
    <tr>
      <td colspan="2" rowspan="3"></td>
      <td colspan="7" style="font-size: 16pt; font-weight: bold; text-transform: uppercase; vertical-align: bottom;">ROOMING LIST</td>
      <td colspan="7" halign="right" style="font-weight: bold; font-size: 10pt; vertical-align: bottom;">
        {{ $tour ? ($tour->code . ' - ' . $tour->name) : 'All Tours' }}
      </td>
    </tr>
    <tr>
      <td colspan="7" style="font-size: 10pt; font-weight: bold; text-transform: uppercase; vertical-align: top;">{{ $company->name }}</td>
      <td colspan="7" halign="right" style="font-size: 9pt; vertical-align: top;">
        Departure Date: <span style="font-weight: bold;">{{ $departure_date ? \Carbon\Carbon::parse($departure_date)->format('d F Y') : 'All Dates' }}</span>
      </td>
    </tr>
    <tr>
      <td colspan="7" style="border-bottom: 2px solid #000000;"></td>
      <td colspan="7" style="border-bottom: 2px solid #000000;"></td>
    </tr>
    <tr>
      <td colspan="16"></td>
    </tr>
  </table>
  @else
  <table cellpadding="0" cellspacing="0" style="width: 100%; border-bottom: 2px solid #000000; margin-bottom: 15px; padding-bottom: 10px;">
    <tr>
      <td colspan="8" valign="bottom">
        @if($company->photo_url)
        <img src="{{ public_path($company->photo_url) }}" class="logo">
        @endif
        <div style="font-size: 16pt; font-weight: bold; text-transform: uppercase; margin-bottom: 2px;">ROOMING LIST</div>
        <div style="font-size: 10pt; font-weight: bold; text-transform: uppercase;">{{ $company->name }}</div>
      </td>
      <td colspan="7" halign="right" valign="bottom">
        <div style="font-weight: bold; font-size: 10pt;">
          {{ $tour ? ($tour->code . ' - ' . $tour->name) : 'All Tours' }}
        </div>
        <div style="font-size: 9pt; margin-top: 5px;">
          Departure Date: <span style="font-weight: bold;">{{ $departure_date ? \Carbon\Carbon::parse($departure_date)->format('d F Y') : 'All Dates' }}</span>
        </div>
      </td>
    </tr>
  </table>
  @endif

  <table style="border-collapse: collapse; width: 100%; table-layout: fixed;">
    <thead>
      <tr>
        @php $thStyle = "background-color: #f1f5f9; border: 1px solid #cbd5e1; font-weight: bold; text-transform: uppercase; text-align: center; vertical-align: middle; padding: 8px 4px; font-size: 7.5pt;"; @endphp
        <th style="{{ $thStyle }}" {!! !$isExcel ? 'width="3%"' : '' !!}>No</th>
        <th style="{{ $thStyle }}" {!! !$isExcel ? 'width="15%"' : '' !!}>Passenger Name</th>
        <th style="{{ $thStyle }}" {!! !$isExcel ? 'width="7%"' : '' !!}>Room Type</th>
        <th style="{{ $thStyle }}" {!! !$isExcel ? 'width="4%"' : '' !!}>Room</th>
        <th style="{{ $thStyle }}" {!! !$isExcel ? 'width="4%"' : '' !!}>Seat</th>
        <th style="{{ $thStyle }}" {!! !$isExcel ? 'width="4%"' : '' !!}>Visa</th>
        <th style="{{ $thStyle }}" {!! !$isExcel ? 'width="10%"' : '' !!}>Remarks</th>
        <th style="{{ $thStyle }}" {!! !$isExcel ? 'width="9%"' : '' !!}>Passport Number</th>
        <th style="{{ $thStyle }}" {!! !$isExcel ? 'width="8%"' : '' !!}>Place of Issue</th>
        <th style="{{ $thStyle }}" {!! !$isExcel ? 'width="6%"' : '' !!}>Date of Issue</th>
        <th style="{{ $thStyle }}" {!! !$isExcel ? 'width="6%"' : '' !!}>Date of Expired</th>
        <th style="{{ $thStyle }}" {!! !$isExcel ? 'width="7%"' : '' !!}>Place of Birth</th>
        <th style="{{ $thStyle }}" {!! !$isExcel ? 'width="6%"' : '' !!}>Date of Birth</th>
        <th style="{{ $thStyle }}" {!! !$isExcel ? 'width="8%"' : '' !!}>Contact</th>
        <th style="{{ $thStyle }}" {!! !$isExcel ? 'width="3%"' : '' !!}>Age</th>
        <th style="{{ $thStyle }}" {!! !$isExcel ? 'width="3%"' : '' !!}>Val</th>
      </tr>
    </thead>
    <tbody>
      @php
      $globalIdx = 1;
      $bookingCounter = 0;
      @endphp
      @foreach($groupedData as $bookingNum => $bookingData)
      @php
      $bookingCounter++;
      $rowBg = ($bookingCounter % 2 == 0) ? 'background-color: #f8fafc;' : 'background-color: #ffffff;';
      $isFirstInBooking = true;
      @endphp

      @foreach($bookingData['rooms'] as $roomType => $paxList)
      @php $isFirstInRoom = true; @endphp

      @foreach($paxList as $pax)
      @php
      $tdStyle = "border: 1px solid #cbd5e1; padding: 6px 4px; vertical-align: middle; " . $rowBg;
      $fullName = trim(($pax->title ? $pax->title . '. ' : '') . $pax->first_name . ' ' . $pax->last_name);
      $age = $pax->dob ? \Carbon\Carbon::parse($pax->dob)->age : '-';

      $valMonths = '-';
      $isWarning = false;
      if($pax->passport_expiry_date) {
      $expDate = \Carbon\Carbon::parse($pax->passport_expiry_date);
      $refDate = $departure_date ? \Carbon\Carbon::parse($departure_date) : now();
      $valMonths = $refDate->diffInMonths($expDate);
      $isWarning = $valMonths < 6;
        }
        @endphp

        <tr>
        <td style="{{ $tdStyle }} text-align: center;">{{ $globalIdx++ }}</td>
        <td style="{{ $tdStyle }} font-weight: bold;">{{ $fullName }}</td>

        @if($isFirstInRoom)
        <td rowspan="{{ count($paxList) }}" style="{{ $tdStyle }} text-align: center; text-transform: uppercase; font-size: 7pt;">{{ $roomType }}</td>
        <td rowspan="{{ count($paxList) }}" style="{{ $tdStyle }}"></td>
        @endif

        <td style="{{ $tdStyle }}"></td>
        <td style="{{ $tdStyle }} text-align: center;">{{ $pax->visa_number ? 'YES' : '-' }}</td>
        <td style="{{ $tdStyle }} font-size: 7pt; font-style: italic; color: #4b5563;">{{ $pax->contact_notes }}</td>
        <td style="{{ $tdStyle }} text-align: center; font-size: 8pt; mso-number-format: '\@'; font-family: monospace;">{{ $pax->passport_number }}</td>
        <td style="{{ $tdStyle }} text-transform: uppercase;">{{ $pax->passport_issue_place }}</td>
        <td style="{{ $tdStyle }} text-align: center; font-size:8pt;">{{ $pax->passport_issue_date ? \Carbon\Carbon::parse($pax->passport_issue_date)->format('d/m/Y') : '-' }}</td>
        <td style="{{ $tdStyle }} text-align: center; font-weight: bold; font-size:8pt;">{{ $pax->passport_expiry_date ? \Carbon\Carbon::parse($pax->passport_expiry_date)->format('d/m/Y') : '-' }}</td>
        <td style="{{ $tdStyle }} text-transform: uppercase;">{{ $pax->pob }}</td>
        <td style="{{ $tdStyle }} text-align: center;">{{ $pax->dob ? \Carbon\Carbon::parse($pax->dob)->format('d/m/Y') : '-' }}</td>

        @if($isFirstInBooking)
        <td rowspan="{{ $bookingData['total_pax'] }}" style="{{ $tdStyle }} text-align: center; font-size: 9.5pt; mso-number-format: '\@';">{{ $bookingData['contact_phone'] ?: '-' }}</td>
        @endif

        <td style="{{ $tdStyle }} text-align: center;">{{ $age }}</td>
        <td style="{{ $tdStyle }} text-align: center; font-weight: bold; {{ $isWarning ? 'color: #dc2626; background-color: #fee2e2;' : '' }}">{{ $valMonths }}</td>
        </tr>

        @php
        $isFirstInBooking = false;
        $isFirstInRoom = false;
        @endphp
        @endforeach
        @endforeach
        @endforeach
    </tbody>
  </table>
</body>

</html>