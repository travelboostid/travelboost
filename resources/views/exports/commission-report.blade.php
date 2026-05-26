@php
    $formatDate = fn ($value) => $value ? \Carbon\Carbon::parse($value)->format('d M Y') : '-';
    $isVendor = $companyType === 'vendor';
@endphp
<table>
    <thead>
        <tr>
            <th colspan="10">TravelBoost Commission Report</th>
        </tr>
        <tr>
            <th colspan="10">{{ $company->name }}</th>
        </tr>
        <tr>
            <th colspan="10">Generated {{ $generatedAt->format('d M Y H:i') }} - Period {{ $filters['period_from'] ?: 'All' }} - {{ $filters['period_to'] ?: 'All' }}</th>
        </tr>
        <tr>
            <th>No</th>
            <th>{{ $isVendor ? 'Agent Code' : 'Vendor' }}</th>
            <th>{{ $isVendor ? 'Agent Name' : 'Vendor Name' }}</th>
            <th>Tour Code</th>
            <th>Tour Name</th>
            <th>Departure Date</th>
            <th>Booking Number</th>
            <th>Customer</th>
            <th>Pax</th>
            <th>{{ $isVendor ? 'Commission Paid' : 'Commission Earned' }}</th>
        </tr>
    </thead>
    <tbody>
        @forelse ($rows as $row)
            <tr>
                <td>{{ $loop->iteration }}</td>
                <td>{{ $isVendor ? $row['agent_code'] : $row['vendor_name'] }}</td>
                <td>{{ $isVendor ? $row['agent_name'] : $row['vendor_name'] }}</td>
                <td>{{ $row['tour_code'] }}</td>
                <td>{{ $row['tour_name'] }}</td>
                <td>{{ $formatDate($row['departure_date']).' - '.$formatDate($row['return_date']) }}</td>
                <td>{{ $row['booking_code'] }}</td>
                <td>{{ $row['booking_contact'] }}</td>
                <td>{{ $row['pax'] }}</td>
                <td>{{ $row['commission_amount'] }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="10">No commission report data found.</td>
            </tr>
        @endforelse
        <tr>
            <td colspan="8">TOTAL</td>
            <td>{{ $summary['total_pax'] }}</td>
            <td>{{ $summary['total_commission'] }}</td>
        </tr>
    </tbody>
</table>
