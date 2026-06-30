@php
    $formatCurrency = fn ($value) => 'Rp '.number_format((float) $value, 0, ',', '.');
    $formatDate = fn ($value) => $value ? \Carbon\Carbon::parse($value)->format('d M Y') : '-';
    $formatDateTime = fn ($value) => $value ? \Carbon\Carbon::parse($value)->format('d M Y H:i') : '-';
    $formatBreakdown = function (array $items) use ($formatCurrency) {
        if ($items === []) {
            return '-';
        }

        return collect($items)
            ->map(fn (array $item) => "{$item['label']} x{$item['quantity']} ({$formatCurrency($item['amount'])})")
            ->implode("\n");
    };
    $isVendor = $companyType === 'vendor';
@endphp
<table>
    <thead>
        <tr>
            <th colspan="19">TravelBoost Sales Report</th>
        </tr>
        <tr>
            <th colspan="19">{{ $company->name }}</th>
        </tr>
        <tr>
            <th colspan="19">
                Generated {{ $generatedAt->format('d M Y H:i') }} - Period {{ $filters['period_from'] ?: 'All' }} - {{ $filters['period_to'] ?: 'All' }}
            </th>
        </tr>
        <tr>
            <th>No</th>
            <th>Payment Date</th>
            <th>{{ $isVendor ? 'Agent Code' : 'Vendor' }}</th>
            <th>{{ $isVendor ? 'Agent Name' : 'Vendor Name' }}</th>
            <th>Tour Code</th>
            <th>Tour Name</th>
            <th>Departure Date</th>
            <th>Booking Number</th>
            <th>Customer</th>
            <th>Pax</th>
            <th>Base Tour</th>
            <th>Taxable Visa</th>
            <th>Taxable Add-ons</th>
            <th>VAT</th>
            <th>Promo</th>
            <th>Non-taxable Items</th>
            <th>Platform Fee</th>
            <th>Grand Total</th>
            <th>{{ $isVendor ? 'Commission Paid' : 'Commission Earned' }}</th>
        </tr>
    </thead>
    <tbody>
        @forelse ($rows as $row)
            <tr>
                <td>{{ $loop->iteration }}</td>
                <td>{{ $formatDateTime($row['paid_at']) }}</td>
                <td>
                    {{ $isVendor ? $row['agent_code'] : $row['vendor_name'] }}
                </td>
                <td>
                    {{ $isVendor ? $row['agent_name'] : $row['vendor_name'] }}
                </td>
                <td>{{ $row['tour_code'] }}</td>
                <td>{{ $row['tour_name'] }}</td>
                <td>
                    {{ $formatDate($row['departure_date']) }} - {{ $formatDate($row['return_date']) }}
                </td>
                <td>{{ $row['booking_code'] }}</td>
                <td>{{ $row['booking_contact'] }}</td>
                <td>{{ $row['pax'] }}</td>
                <td>{{ $formatCurrency($row['base_tour_total']) }}</td>
                <td>{{ $formatBreakdown($row['taxable_visa_items']) }}</td>
                <td>{{ $formatBreakdown($row['taxable_addon_items']) }}</td>
                <td>{{ $formatCurrency($row['vat_amount']) }}</td>
                <td>
                    {{ $row['promo_amount'] > 0 ? '- '.$formatCurrency($row['promo_amount']) : '-' }}
                </td>
                <td>
                    {{
                        $formatBreakdown(
                            array_merge(
                                collect($row['non_taxable_visa_items'])
                                    ->map(fn (array $item) => ['label' => 'Visa: '.$item['label'], 'quantity' => $item['quantity'], 'amount' => $item['amount']])
                                    ->all(),
                                collect($row['non_taxable_addon_items'])
                                    ->map(fn (array $item) => ['label' => 'Add-on: '.$item['label'], 'quantity' => $item['quantity'], 'amount' => $item['amount']])
                                    ->all(),
                            ),
                        )
                    }}
                </td>
                <td>{{ $formatCurrency($row['platform_fee']) }}</td>
                <td>{{ $formatCurrency($row['grand_total']) }}</td>
                <td>{{ $formatCurrency($row['commission_amount']) }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="19">No sales report data found.</td>
            </tr>
        @endforelse
        <tr>
            <td colspan="9">TOTAL</td>
            <td>{{ $summary['total_pax'] }}</td>
            <td>{{ $formatCurrency($summary['base_tour_total']) }}</td>
            <td>{{ $formatCurrency($summary['taxable_visa_total']) }}</td>
            <td>{{ $formatCurrency($summary['taxable_addon_total']) }}</td>
            <td>{{ $formatCurrency($summary['vat_total']) }}</td>
            <td>
                {{ $summary['promo_total'] > 0 ? '- '.$formatCurrency($summary['promo_total']) : '-' }}
            </td>
            <td>
                {{ $formatCurrency($summary['non_taxable_visa_total'] + $summary['non_taxable_addon_total']) }}
            </td>
            <td>{{ $formatCurrency($summary['platform_fee_total']) }}</td>
            <td>{{ $formatCurrency($summary['total_sales']) }}</td>
            <td>{{ $formatCurrency($summary['total_commission']) }}</td>
        </tr>
    </tbody>
</table>
