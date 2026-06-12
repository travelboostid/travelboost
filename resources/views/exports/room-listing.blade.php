<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>Room Listing</title>
    @if (!$isExcel)
        <style>
            @page {
                margin: 18px 22px;
            }

            body {
                font-family: Helvetica, Arial, sans-serif;
                font-size: 7.2pt;
                color: #0f172a;
                margin: 0;
                padding: 0;
            }

            .page-header {
                width: 100%;
                border-bottom: 2px solid #111827;
                padding-bottom: 12px;
                margin-bottom: 14px;
            }

            .page-header td {
                vertical-align: middle;
            }

            .logo {
                max-height: 48px;
                width: auto;
            }

            .title {
                font-size: 18pt;
                font-weight: 800;
                letter-spacing: 0.04em;
                text-transform: uppercase;
                margin-bottom: 2px;
                color: #0f172a;
            }

            .company-name {
                font-size: 10pt;
                font-weight: 700;
                text-transform: uppercase;
                color: #334155;
            }

            .meta-label {
                font-size: 7.5pt;
                font-weight: 700;
                text-transform: uppercase;
                color: #64748b;
            }

            .meta-value {
                font-size: 9pt;
                font-weight: 700;
                color: #0f172a;
            }
        </style>
    @endif
</head>

<body
    style="{{ $isExcel ? 'font-family: Arial, sans-serif; font-size: 10px; color: #0f172a;' : '' }}"
>
    @if ($isExcel)
        <table style="width: 100%">
            <tr>
                <td colspan="2" rowspan="3"></td>
                <td
                    colspan="7"
                    rowspan="2"
                    style="
                        font-size: 18pt;
                        font-weight: 800;
                        text-transform: uppercase;
                        vertical-align: middle;
                        color: #0f172a;
                    "
                >
                    Room Listing
                </td>
                <td
                    colspan="2"
                    style="
                        font-size: 8pt;
                        font-weight: 700;
                        text-transform: uppercase;
                        color: #64748b;
                        vertical-align: middle;
                    "
                >
                    Tour Product
                </td>
                <td
                    colspan="7"
                    style="
                        font-size: 10pt;
                        font-weight: 700;
                        color: #0f172a;
                        vertical-align: middle;
                    "
                >
                    {{ $tour ? ($tour->code . ' - ' . $tour->name) : 'Not selected' }}
                </td>
            </tr>
            <tr>
                <td
                    colspan="2"
                    style="
                        font-size: 8pt;
                        font-weight: 700;
                        text-transform: uppercase;
                        color: #64748b;
                        vertical-align: middle;
                    "
                >
                    Departure Date
                </td>
                <td
                    colspan="7"
                    style="
                        font-size: 10pt;
                        font-weight: 700;
                        color: #0f172a;
                        vertical-align: middle;
                    "
                >
                    {{ $departure_date ? \Carbon\Carbon::parse($departure_date)->format('d F Y') : 'Not selected' }}
                </td>
            </tr>
            <tr>
                <td
                    colspan="7"
                    style="
                        font-size: 10pt;
                        font-weight: 700;
                        text-transform: uppercase;
                        vertical-align: top;
                        color: #334155;
                    "
                >
                    {{ $company->name }}
                </td>
                <td colspan="9" style="border-bottom: 2px solid #111827"></td>
            </tr>
            <tr>
                <td colspan="18"></td>
            </tr>
        </table>
    @else
        <table cellpadding="0" cellspacing="0" class="page-header">
            <tr>
                <td style="width: 65%">
                    <table cellpadding="0" cellspacing="0" style="width: 100%">
                        <tr>
                            @if ($company->photo_url)
                                <td style="width: 68px; vertical-align: middle">
                                    <img
                                        src="{{ public_path($company->photo_url) }}"
                                        class="logo"
                                        alt="Company logo"
                                    />
                                </td>
                            @endif
                            <td style="vertical-align: middle">
                                <div class="title">Room Listing</div>
                                <div class="company-name">
                                    {{ $company->name }}
                                </div>
                            </td>
                        </tr>
                    </table>
                </td>
                <td style="width: 35%; text-align: right">
                    <div class="meta-label">Tour Product</div>
                    <div class="meta-value">
                        {{ $tour ? ($tour->code . ' - ' . $tour->name) : 'Not selected' }}
                    </div>
                    <div class="meta-label" style="margin-top: 8px">
                        Departure Date
                    </div>
                    <div class="meta-value">
                        {{ $departure_date ? \Carbon\Carbon::parse($departure_date)->format('d F Y') : 'Not selected' }}
                    </div>
                </td>
            </tr>
        </table>
    @endif

    <table style="border-collapse: collapse; width: 100%; table-layout: fixed">
        <thead>
            <tr>
                @php
          $headerStyle = "background-color: #f1f5f9; border: 1px solid #cbd5e1; font-weight: 700; text-transform: uppercase; text-align: center; vertical-align: middle; padding: 6px 3px; font-size: 6.7pt; color: #0f172a;";
        @endphp
                <th
                    style="{{ $headerStyle }}"
                    {!! !$isExcel ? 'width="3%"' : '' !!}
                    >No
                </th>
                <th
                    style="{{ $headerStyle }}"
                    {!! !$isExcel ? 'width="6%"' : '' !!}
                    >Title
                </th>
                <th
                    style="{{ $headerStyle }}"
                    {!! !$isExcel ? 'width="15%"' : '' !!}
                    >Passenger Name
                </th>
                <th
                    style="{{ $headerStyle }}"
                    {!! !$isExcel ? 'width="8%"' : '' !!}
                    >Room Type
                </th>
                <th
                    style="{{ $headerStyle }}"
                    {!! !$isExcel ? 'width="4%"' : '' !!}
                    >Room No.
                </th>
                <th
                    style="{{ $headerStyle }}"
                    {!! !$isExcel ? 'width="4%"' : '' !!}
                    >Room
                </th>
                <th
                    style="{{ $headerStyle }}"
                    {!! !$isExcel ? 'width="4%"' : '' !!}
                    >Seat
                </th>
                <th
                    style="{{ $headerStyle }}"
                    {!! !$isExcel ? 'width="4%"' : '' !!}
                    >Visa
                </th>
                <th
                    style="{{ $headerStyle }}"
                    {!! !$isExcel ? 'width="14%"' : '' !!}
                    >Remarks
                </th>
                <th
                    style="{{ $headerStyle }}"
                    {!! !$isExcel ? 'width="10%"' : '' !!}
                    >Passport Number
                </th>
                <th
                    style="{{ $headerStyle }}"
                    {!! !$isExcel ? 'width="8%"' : '' !!}
                    >Issue Date
                </th>
                <th
                    style="{{ $headerStyle }}"
                    {!! !$isExcel ? 'width="8%"' : '' !!}
                    >Expiry Date
                </th>
                <th
                    style="{{ $headerStyle }}"
                    {!! !$isExcel ? 'width="8%"' : '' !!}
                    >Place of Birth
                </th>
                <th
                    style="{{ $headerStyle }}"
                    {!! !$isExcel ? 'width="8%"' : '' !!}
                    >Date of Birth
                </th>
                <th
                    style="{{ $headerStyle }}"
                    {!! !$isExcel ? 'width="9%"' : '' !!}
                    >Contact
                </th>
                <th
                    style="{{ $headerStyle }}"
                    {!! !$isExcel ? 'width="4%"' : '' !!}
                    >Age
                </th>
                <th
                    style="{{ $headerStyle }}"
                    {!! !$isExcel ? 'width="11%"' : '' !!}
                    >Agent Name
                </th>
                <th
                    style="{{ $headerStyle }}"
                    {!! !$isExcel ? 'width="4%"' : '' !!}
                    >Val
                </th>
            </tr>
        </thead>
        <tbody>
            @php
        $globalIndex = 1;
        $agentCounter = 0;
        $roomCounter = 0;
      @endphp
            @foreach ($groupedData as $agentGroup)
                @php
          $agentCounter++;
          $agentBackground = $agentCounter % 2 === 0 ? '#f8fafc' : '#ffffff';
          $agentBookings = $agentGroup['bookings'];
          $agentName = $agentGroup['agent_name'];
          $agentTotalPax = collect($agentBookings)->sum('total_pax');
        @endphp
                <tr>
                    <td
                        colspan="18"
                        style="border: 1px solid #94a3b8; background-color: #e2e8f0; color: #0f172a; font-weight: 700; text-transform: uppercase; padding: 6px 8px;"
                    >
                        Agent: {{ $agentName }} ({{ $agentTotalPax }} pax)
                    </td>
                </tr>
                @foreach ($agentBookings as $bookingData)
                    @php
            $rowBackground = "background-color: {$agentBackground};";
            $isFirstInBooking = true;
            $bookingNumber = $bookingData['booking_number'];
            $bookingRooms = $bookingData['rooms'];
            $totalPaxInBooking = $bookingData['total_pax'];
          @endphp
                    @foreach ($bookingRooms as $roomGroup)
                        @php
              $roomType = $roomGroup['room_type'];
              $passengers = $roomGroup['passengers'];
              $isFirstInRoom = true;
              $roomPassengerCount = count($passengers);
              $roomCounter++;
              $roomNumber = $roomGroup['room_number'] ?? $roomCounter;
            @endphp
                        @foreach ($passengers as $passenger)
                            @php
                $cellStyle = "border: 1px solid #cbd5e1; padding: 6px 4px; vertical-align: middle; color: #0f172a; " . $rowBackground;
                $fullName = trim($passenger->first_name . ' ' . $passenger->last_name);
                $age = $passenger->dob ? \Carbon\Carbon::parse($passenger->dob)->age : '-';
                $validityMonths = '-';
                $isWarning = false;

                if ($passenger->passport_expiry_date) {
                  $expiryDate = \Carbon\Carbon::parse($passenger->passport_expiry_date);
                  $referenceDate = $departure_date ? \Carbon\Carbon::parse($departure_date) : now();
                  $validityMonths = (int) round($referenceDate->diffInMonths($expiryDate, false));
                  $isWarning = $validityMonths < 6;
                }
              @endphp
                            <tr>
                                <td style="{{ $cellStyle }} text-align: center;">
                                    {{ $globalIndex++ }}
                                </td>
                                <td style="{{ $cellStyle }} text-align: center; font-weight: 700;">
                                    {{ $passenger->title ?: '-' }}
                                </td>
                                <td style="{{ $cellStyle }} font-weight: 700;">
                                    {{ $fullName !== '' ? $fullName : '-' }}
                                </td>

                                @if ($isFirstInRoom)
                                    <td
                                        rowspan="{{ $roomPassengerCount }}"
                                        style="{{ $cellStyle }} text-align: center; text-transform: uppercase; font-size: 7pt;"
                                    >
                                        {{ $roomType }}
                                    </td>
                                    <td
                                        rowspan="{{ $roomPassengerCount }}"
                                        style="{{ $cellStyle }} text-align: center; font-weight: 700;"
                                    >
                                        {{ $roomNumber }}
                                    </td>
                                    <td
                                        rowspan="{{ $roomPassengerCount }}"
                                        style="{{ $cellStyle }} text-align: center;"
                                    ></td>
                                @endif

                                <td
                                    style="{{ $cellStyle }} text-align: center;"
                                ></td>
                                <td
                                    style="{{ $cellStyle }} text-align: center;"
                                ></td>
                                <td
                                    style="{{ $cellStyle }} font-size: 7pt; font-style: italic; color: #475569;"
                                >
                                    {{ $passenger->note ?: '-' }}
                                </td>
                                <td
                                    style="{{ $cellStyle }} text-align: center; font-size: 8pt; mso-number-format: '\@'; font-family: monospace;"
                                >
                                    {{ $passenger->passport_number ?: '-' }}
                                </td>
                                <td
                                    style="{{ $cellStyle }} text-align: center; font-size: 8pt;"
                                >
                                    {{ $passenger->passport_issue_date ? \Carbon\Carbon::parse($passenger->passport_issue_date)->format('d/m/Y') : '-' }}
                                </td>
                                <td
                                    style="{{ $cellStyle }} text-align: center; font-size: 8pt; font-weight: 700;"
                                >
                                    {{ $passenger->passport_expiry_date ? \Carbon\Carbon::parse($passenger->passport_expiry_date)->format('d/m/Y') : '-' }}
                                </td>
                                <td
                                    style="{{ $cellStyle }} text-transform: uppercase;"
                                >
                                    {{ $passenger->pob ?: '-' }}
                                </td>
                                <td style="{{ $cellStyle }} text-align: center;">
                                    {{ $passenger->dob ? \Carbon\Carbon::parse($passenger->dob)->format('d/m/Y') : '-' }}
                                </td>

                                @if ($isFirstInBooking)
                                    <td
                                        rowspan="{{ $totalPaxInBooking }}"
                                        style="{{ $cellStyle }} text-align: center; font-size: 8pt; mso-number-format: '\@';"
                                    >
                                        {{ $bookingData['contact_phone'] ?: '-' }}
                                    </td>
                                @endif

                                <td style="{{ $cellStyle }} text-align: center;">
                                    {{ $age }}
                                </td>
                                @if ($isFirstInBooking)
                                    <td
                                        rowspan="{{ $totalPaxInBooking }}"
                                        style="{{ $cellStyle }} text-align: center; font-weight: 700;"
                                    >
                                        {{ $agentName }}
                                    </td>
                                @endif
                                <td
                                    style="{{ $cellStyle }} text-align: center; font-weight: 700; {{ $isWarning ? 'background-color: #fee2e2; color: #dc2626;' : '' }}"
                                >
                                    {{ $validityMonths }}
                                </td>
                            </tr>
                            @php
                $isFirstInBooking = false;
                $isFirstInRoom = false;
              @endphp
                        @endforeach
                    @endforeach
                @endforeach
            @endforeach
        </tbody>
    </table>
    @if (!empty($roomRecap))
        <table style="border-collapse: collapse; width: 100%; margin-top: 14px">
            <tr>
                @if ($isExcel)
                    <td></td>
                @endif
                <td
                    colspan="2"
                    style="
                        font-weight: 700;
                        text-transform: uppercase;
                        color: #0f172a;
                        padding: 6px 4px;
                    "
                >
                    Room Recap
                </td>
            </tr>
            @foreach ($roomRecap as $item)
                <tr>
                    @if ($isExcel)
                        <td></td>
                    @endif
                    <td
                        style="
                            width: 220px;
                            padding: 4px;
                            border: 1px solid #cbd5e1;
                        "
                    >
                        {{ $item['room_type'] }}
                    </td>
                    <td
                        style="
                            padding: 4px;
                            border: 1px solid #cbd5e1;
                            font-weight: 700;
                        "
                    >
                        {{ $item['count'] }} {{ $item['count'] === 1 ? 'room' : 'rooms' }}
                    </td>
                </tr>
            @endforeach
        </table>
    @endif
</body>
</html>
