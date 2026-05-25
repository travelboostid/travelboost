@php
    $formatCurrency = fn ($value) => 'Rp '.number_format((float) $value, 0, ',', '.');
    $formatDate = fn ($value) => $value ? \Carbon\Carbon::parse($value)->format('d M Y') : '-';
    $isVendor = $companyType === 'vendor';
@endphp
<table>
    <thead>
        <tr>
            <th colspan="16">TravelBoost Sales Report</th>
        </tr>
        <tr>
            <th colspan="16">{{ $company->name }}</th>
        </tr>
        <tr>
            <th colspan="16">Generated {{ $generatedAt->format('d M Y H:i') }} - Period {{ $filters['period_from'] ?: 'All' }} - {{ $filters['period_to'] ?: 'All' }}</th>
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
            <th>Tour Price</th>
            <th>Pax</th>
            <th>Tour Price x Pax</th>
            <th>VAT</th>
            <th>Add On</th>
            <th>Promo</th>
            <th>Total</th>
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
                <td>{{ $row['tour_price'] }}</td>
                <td>{{ $row['pax'] }}</td>
                <td>{{ $row['tour_price_total'] }}</td>
                <td>{{ $row['tax_amount'] }}</td>
                <td>{{ $row['addon_cost'] }}</td>
                <td>{{ $row['promo_amount'] }}</td>
                <td>{{ $row['grand_total'] }}</td>
                <td>{{ $row['commission_amount'] }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="16">No sales report data found.</td>
            </tr>
        @endforelse
        <tr>
            <td colspan="9">TOTAL</td>
            <td>{{ $summary['total_pax'] }}</td>
            <td>{{ $rows->sum('tour_price_total') }}</td>
            <td>{{ $rows->sum('tax_amount') }}</td>
            <td>{{ $rows->sum('addon_cost') }}</td>
            <td>{{ $rows->sum('promo_amount') }}</td>
            <td>{{ $summary['total_sales'] }}</td>
            <td>{{ $summary['total_commission'] }}</td>
        </tr>
    </tbody>
</table>
