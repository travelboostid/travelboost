@php
    $formatDate = fn ($value) => $value ? \Carbon\Carbon::parse($value)->format('d M Y') : '-';
    $isVendor = $companyType === 'vendor';
@endphp
<table>
    <thead>
        <tr>
            <th colspan="20">TravelBoost Booking List Report</th>
        </tr>
        <tr>
            <th colspan="20">{{ $company->name }}</th>
        </tr>
        <tr>
            <th colspan="20">
                Generated {{ $generatedAt->format('d M Y H:i') }} - Period {{ $filters['period_from'] ?: 'All' }} - {{ $filters['period_to'] ?: 'All' }}
            </th>
        </tr>
        <tr>
            <th>No</th>
            <th>{{ $isVendor ? 'Agent Code' : 'Vendor' }}</th>
            <th>{{ $isVendor ? 'Agent Name' : 'Vendor Name' }}</th>
            <th>Tour Code</th>
            <th>Tour Name</th>
            <th>Departure Date</th>
            <th>Booking Number</th>
            <th>Payment Status</th>
            <th>Customer</th>
            <th>Passenger</th>
            <th>Price Category</th>
            <th>Tour Price</th>
            <th>Pax</th>
            <th>Tour Price x Pax</th>
            <th>VAT</th>
            <th>Add On</th>
            <th>Platform Fee</th>
            <th>Promo</th>
            <th>Total</th>
            <th>{{ $isVendor ? 'Commission Paid' : 'Commission Earned' }}</th>
        </tr>
    </thead>
    <tbody>
        @forelse ($rows as $row)
            @foreach ($row['passengers'] as $passenger)
                @php
                    $rowspan = count($row['passengers']);
                    $isFirstPassenger = $loop->first;
                @endphp
                <tr>
                    @if ($isFirstPassenger)
                        <td rowspan="{{ $rowspan }}">
                            {{ $loop->parent->iteration }}
                        </td>
                        <td rowspan="{{ $rowspan }}">
                            {{ $isVendor ? $row['agent_code'] : $row['vendor_name'] }}
                        </td>
                        <td rowspan="{{ $rowspan }}">
                            {{ $isVendor ? $row['agent_name'] : $row['vendor_name'] }}
                        </td>
                        <td rowspan="{{ $rowspan }}">
                            {{ $row['tour_code'] }}
                        </td>
                        <td rowspan="{{ $rowspan }}">
                            {{ $row['tour_name'] }}
                        </td>
                        <td rowspan="{{ $rowspan }}">
                            {{ $formatDate($row['departure_date']).' - '.$formatDate($row['return_date']) }}
                        </td>
                        <td rowspan="{{ $rowspan }}">
                            {{ $row['booking_code'] }}
                        </td>
                        <td rowspan="{{ $rowspan }}">
                            {{ $row['booking_status'] === 'full payment' ? 'Full Payment' : 'Down Payment' }}
                        </td>
                        <td rowspan="{{ $rowspan }}">
                            {{ $row['booking_customer'] }}
                        </td>
                    @endif
                    <td>
                        {{ $passenger['name'].' / DOB: '.$formatDate($passenger['dob'] ?? null) }}
                    </td>
                    <td>{{ $passenger['category'] }}</td>
                    <td>{{ $passenger['price_amount'] }}</td>
                    <td>1</td>
                    @if ($isFirstPassenger)
                        <td rowspan="{{ $rowspan }}">
                            {{ $row['tour_price_total'] }}
                        </td>
                        <td rowspan="{{ $rowspan }}">
                            {{ $row['tax_amount'] }}
                        </td>
                        <td rowspan="{{ $rowspan }}">
                            {{ $row['addon_cost'] }}
                        </td>
                        <td rowspan="{{ $rowspan }}">
                            {{ $row['platform_fee'] }}
                        </td>
                    @endif
                    <td>{{ $passenger['promo_amount'] }}</td>
                    @if ($isFirstPassenger)
                        <td rowspan="{{ $rowspan }}">
                            {{ $row['grand_total'] }}
                        </td>
                        <td rowspan="{{ $rowspan }}">
                            {{ $row['commission_amount'] }}
                        </td>
                    @endif
                </tr>
            @endforeach
        @empty
            <tr>
                <td colspan="20">No booking list data found.</td>
            </tr>
        @endforelse
        <tr>
            <td colspan="12">TOTAL</td>
            <td>{{ $rows->sum('pax') }}</td>
            <td>{{ $rows->sum('tour_price_total') }}</td>
            <td>{{ $rows->sum('tax_amount') }}</td>
            <td>{{ $rows->sum('addon_cost') }}</td>
            <td>{{ $rows->sum('platform_fee') }}</td>
            <td>{{ $rows->sum('promo_amount') }}</td>
            <td>{{ $summary['total_sales'] }}</td>
            <td>{{ $summary['total_commission'] }}</td>
        </tr>
    </tbody>
</table>
