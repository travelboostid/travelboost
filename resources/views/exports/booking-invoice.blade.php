@php
    use Illuminate\Support\Carbon;

    $formatCurrency = fn ($value): string => 'Rp '.number_format((float) $value, 0, ',', '.');
    $formatDate = fn ($date): string => $date ? Carbon::parse($date)->format('d F Y') : '-';
    $formatPercent = fn ($value): string => rtrim(rtrim(number_format((float) $value, 2, '.', ''), '0'), '.');
    $agentName = $agent?->name ?? 'TravelBoost Agent';
    $agentEmail = $agent?->email ?? null;
    $agentPhone = $agent?->customer_service_phone ?: $agent?->phone;
    $agentAddress = $agent?->address;
    $billedName = $billedToName ?? $customerName;
    $billedEmail = $billedToEmail ?? ($booking->contact_email ?: $booking->user?->email);
    $billedPhone = $billedToPhone ?? ($booking->contact_phone ?: $booking->user?->phone);
    $billedAddress = $billedToAddress ?? null;
    $tour = $booking->tour;
    $vatAmount = (float) $booking->tax_amount;
    $grandTotal = (float) ($invoiceGrandTotal ?? $booking->grand_total);
    $invoiceNumber = $invoiceNumber ?? $booking->booking_number;
    $paidAmount = (float) ($invoicePaidAmount ?? $paidAmount);
    $isProforma = (bool) ($isProforma ?? false);
    $invoiceTitle = $isProforma ? 'PROFORMA INVOICE' : 'INVOICE';
    $invoiceStatus = $isProforma ? 'Down Payment' : (($paidAmount >= $grandTotal) ? 'Paid' : 'Down Payment');
    $invoiceDate = $invoiceDate ?? $booking->created_at;
    $remainingAmount = max(0, $grandTotal - $paidAmount);
    $paymentInstructions = collect($paymentInstructions ?? []);
    $platformFeeAmount = (float) ($platformFeeAmount ?? 0);
    $nonTaxableAddonSummaryRows = collect($nonTaxableAddonSummaryRows ?? []);
@endphp
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>Invoice {{ $invoiceNumber }}</title>
    <style>

        @page
        {
                       margin: 16px;
                       size: A4 portrait;
                   }

                   * {
                       box-sizing: border-box;
                   }

                   body {
                       margin: 0;
                       background: #ffffff;
                       color: #111827;
                       font-family: Arial, Helvetica, sans-serif;
                       font-size: 10px;
                       line-height: 1.28;
                   }

                   .page {
                       position: relative;
                       padding: 20px 22px 14px;
                       border: 1px solid #ead7e3;
                       overflow: hidden;
                   }

                   .accent {
                       position: absolute;
                       top: 0;
                       right: 0;
                       width: 178px;
                       height: 88px;
                       background: #c83b8b;
                   }

                   .header {
                       position: relative;
                       z-index: 1;
                       display: table;
                       width: 100%;
                       margin-bottom: 24px;
                   }

                   .brand,
                   .invoice-title {
                       display: table-cell;
                       vertical-align: top;
                   }

                   .brand {
                       width: 60%;
                   }

                   .invoice-title {
                       width: 40%;
                       padding-top: 1px;
                       padding-left: 18px;
                       text-align: right;
                       color: #ffffff;
                   }

                   .brand-row {
                       display: table;
                       width: 100%;
                   }

                   .logo-box,
                   .brand-text {
                       display: table-cell;
                       vertical-align: middle;
                   }

                   .logo-box {
                       width: 52px;
                       height: 52px;
                       border: 1px solid #ead7e3;
                       background: #fff5fb;
                       text-align: center;
                   }

                   .logo-box img {
                       max-width: 46px;
                       max-height: 46px;
                       margin-top: 2px;
                   }

                   .logo-initial {
                       display: block;
                       width: 50px;
                       height: 50px;
                       color: #c83b8b;
                       font-size: 21px;
                       font-weight: 700;
                       line-height: 50px;
                       text-align: center;
                   }

                   .brand-text {
                       padding-left: 12px;
                   }

                   .company-name {
                       margin: 0 0 4px;
                       color: #111827;
                       font-size: 17px;
                       font-weight: 700;
                       letter-spacing: 0.01em;
                   }

                   .company-meta {
                       margin: 0;
                       color: #667085;
                       font-size: 9px;
                   }

                   .invoice-word {
                       margin: 0;
                       font-size: {{ $isProforma ? '17px' : '24px' }};
                       font-weight: 700;
                       letter-spacing: 0.08em;
                       line-height: {{ $isProforma ? '1.08' : '1.1' }};
                   }

                   .invoice-word span {
                       display: block;
                   }

                   .invoice-meta-value {
                       color: #111827;
                       font-size: 11px;
                       font-weight: 700;
                       line-height: 1.35;
                   }

                   .section-grid {
                       display: table;
                       width: 100%;
                       margin-bottom: 14px;
                   }

                   .section-cell {
                       display: table-cell;
                       width: 50%;
                       vertical-align: top;
                   }

                   .section-cell.right {
                       padding-left: 24px;
                   }

                   .label {
                       margin: 0 0 7px;
                       color: #c83b8b;
                       font-size: 9px;
                       font-weight: 700;
                       letter-spacing: 0.16em;
                       text-transform: uppercase;
                   }

                   .customer-name {
                       margin: 0 0 5px;
                       color: #111827;
                       font-size: 15px;
                       font-weight: 700;
                   }

                   .muted {
                       color: #667085;
                   }

                   .info-table {
                       width: 100%;
                       border-collapse: collapse;
                   }

                   .info-table td {
                       padding: 2px 0;
                       vertical-align: top;
                   }

                   .info-table .key {
                       width: 88px;
                       color: #667085;
                       font-weight: 700;
                   }

                   .panel {
                       margin-bottom: 10px;
                       border: 1px solid #edf0f4;
                       background: #ffffff;
                   }

                   .panel-title {
                       padding: 8px 10px;
                       border-bottom: 1px solid #edf0f4;
                       background: #fff5fb;
                       color: #111827;
                       font-size: 10px;
                       font-weight: 700;
                       letter-spacing: 0.12em;
                       text-transform: uppercase;
                   }

                   .panel-body {
                       padding: 9px 10px;
                   }

                   .tour-name {
                       margin: 0 0 7px;
                       color: #111827;
                       font-size: 14px;
                       font-weight: 700;
                   }

                   .tour-meta {
                       display: table;
                       width: 100%;
                   }

                   .tour-meta-item {
                       display: table-cell;
                       width: 25%;
                       padding-right: 10px;
                   }

                   .meta-caption {
                       display: block;
                       margin-bottom: 3px;
                       color: #98a2b3;
                       font-size: 8px;
                       font-weight: 700;
                       letter-spacing: 0.12em;
                       text-transform: uppercase;
                   }

                   .meta-value {
                       color: #111827;
                       font-size: 10px;
                       font-weight: 700;
                   }

                   .pax-grid {
                       width: 100%;
                       border-collapse: collapse;
                   }

                   .pax-grid td {
                       width: 25%;
                       padding: 4px 7px;
                       border-bottom: 1px solid #edf0f4;
                       color: #111827;
                       font-size: 10px;
                   }

                   .pax-grid tr:last-child td {
                       border-bottom: 0;
                   }

                   .pax-count {
                       white-space: nowrap;
                       color: #111827;
                       font-weight: 700;
                   }

                   .details-title {
                       margin: 12px 0 6px;
                       color: #667085;
                       font-size: 10px;
                       font-weight: 700;
                       letter-spacing: 0.12em;
                       text-transform: uppercase;
                   }

                   .payment-table {
                       width: 100%;
                       border-collapse: collapse;
                   }

                   .payment-table th {
                       padding: 7px 8px;
                       background: #c83b8b;
                       color: #ffffff;
                       font-size: 9px;
                       letter-spacing: 0.02em;
                       text-align: left;
                       text-transform: uppercase;
                   }

                   .payment-table th.qty,
                   .payment-table td.qty {
                       text-align: center;
                       width: 48px;
                   }

                   .payment-table th.amount,
                   .payment-table td.amount {
                       text-align: right;
                       white-space: nowrap;
                   }

                   .payment-table td {
                       padding: 6px 8px;
                       border-right: 1px solid #edf0f4;
                       border-bottom: 1px solid #edf0f4;
                       font-size: 10px;
                   }

                   .payment-table td:last-child,
                   .payment-table th:last-child {
                       border-right: 0;
                   }

                   .payment-table tbody tr:nth-child(even) td {
                       background: #f8fafc;
                   }

                   .payment-table .strong {
                       color: #111827;
                       font-weight: 700;
                   }

                   .payment-table tr.table-total td {
                       background: #fff5fb;
                       color: #111827;
                       font-weight: 700;
                   }

                   .summary-grid {
                       display: table;
                       width: 100%;
                       margin-top: 10px;
                   }

                   .summary-left,
                   .summary-right {
                       display: table-cell;
                       vertical-align: top;
                   }

                   .summary-left {
                       width: 44%;
                       padding-right: 12px;
                   }

                   .summary-right {
                       width: 56%;
                       padding-left: 12px;
                   }

                   .summary-table {
                       width: 100%;
                       border-collapse: collapse;
                   }

                   .summary-table td {
                       padding: 4px 0;
                       border-bottom: 1px solid #edf0f4;
                       color: #667085;
                       font-size: 10px;
                   }

                   .summary-table td.amount {
                       color: #475467;
                       font-weight: 700;
                       text-align: right;
                       white-space: nowrap;
                   }

                   .summary-table tr.total td {
                       color: #111827;
                       font-size: 11px;
                       font-weight: 700;
                   }

                   .grand-box {
                       padding: 12px 14px;
                       background: #c83b8b;
                       color: #ffffff;
                       text-align: right;
                   }

                   .grand-label {
                       margin: 0 0 5px;
                       font-size: 10px;
                       font-weight: 700;
                       letter-spacing: 0.1em;
                       text-align: left;
                       text-transform: uppercase;
                   }

                   .grand-amount {
                       font-size: 22px;
                       font-weight: 700;
                   }

                   .paid-stamp {
                       display: table;
                       width: 100%;
                       margin-top: 12px;
                   }

                   .paid-left,
                   .paid-right {
                       display: table-cell;
                       vertical-align: middle;
                   }

                   .paid-left {
                       width: 50%;
                   }

                   .paid-right {
                       width: 50%;
                       text-align: right;
                   }

                   .stamp {
                       display: inline-block;
                       opacity: 0.85;
                       padding: 7px 14px;
                       border: 2px solid #16a34a;
                       color: #15803d;
                       font-size: 16px;
                       font-weight: 700;
                       letter-spacing: 0.18em;
                       text-transform: uppercase;
                   }

                   .stamp.proforma {
                       border-color: #d97706;
                       color: #b45309;
                   }

                   .stamp-date {
                       margin-top: 8px;
                       color: #667085;
                       font-size: 9px;
                       font-weight: 700;
                       letter-spacing: 0.04em;
                       text-transform: uppercase;
                   }

                   .proforma-notice {
                       margin-bottom: 10px;
                       padding: 8px 10px;
                       border: 1px solid #f5c2dc;
                       background: #fff5fb;
                       color: #7a284f;
                       font-size: 9px;
                       line-height: 1.35;
                   }

                   .proforma-notice strong {
                       display: block;
                       margin-bottom: 2px;
                       color: #a12e6e;
                       font-size: 10px;
                       letter-spacing: 0.08em;
                       text-transform: uppercase;
                   }

                   .instruction-panel {
                       margin-bottom: 10px;
                       border: 1px solid #f5c2dc;
                       background: #fffafd;
                   }

                   .instruction-panel .panel-title {
                       border-bottom-color: #f5c2dc;
                       background: #c83b8b;
                       color: #ffffff;
                   }

                   .instruction-table {
                       width: 100%;
                       border-collapse: collapse;
                   }

                   .instruction-table td {
                       padding: 5px 10px;
                       border-bottom: 1px solid #f8d7e8;
                       color: #475467;
                       font-size: 9px;
                   }

                   .instruction-table tr:last-child td {
                       border-bottom: 0;
                   }

                   .instruction-table .key {
                       width: 138px;
                       color: #7a284f;
                       font-weight: 700;
                   }

                   .payment-total {
                       color: #111827;
                       font-size: 16px;
                       font-weight: 700;
                   }

                   .payment-total.paid-amount {
                       color: #15803d;
                   }

                   .payment-total.remaining-amount {
                       color: #c83b8b;
                       font-size: 18px;
                   }

                   .footer {
                       display: table;
                       width: 100%;
                       margin-top: 12px;
                       border-top: 1px solid #edf0f4;
                       padding-top: 8px;
                       color: #667085;
                       font-size: 8px;
                   }

                   .footer-left,
                   .footer-right {
                       display: table-cell;
                       width: 50%;
                   }

                   .footer-right {
                       text-align: right;
                   }
    </style>
</head>
<body>
    <div class="page">
        <div class="accent"></div>

        <div class="header">
            <div class="brand">
                <div class="brand-row">
                    <div class="logo-box">
                        @if ($logoSrc)
                            <img src="{{ $logoSrc }}" alt="{{ $agentName }}" />
                        @else
                            <span
                                class="logo-initial"
                                >{{ strtoupper(substr($agentName, 0, 1)) }}</span
                            >
                        @endif
                    </div>
                    <div class="brand-text">
                        <h1 class="company-name">{{ $agentName }}</h1>
                        @if ($agentAddress)
                            <p class="company-meta">{{ $agentAddress }}</p>
                        @endif
                        @if ($agentEmail)
                            <p class="company-meta">{{ $agentEmail }}</p>
                        @endif
                        @if ($agentPhone)
                            <p class="company-meta">{{ $agentPhone }}</p>
                        @endif
                    </div>
                </div>
            </div>
            <div class="invoice-title">
                <h2 class="invoice-word">
                    @if ($isProforma)
                        <span>PROFORMA</span>
                        <span>INVOICE</span>
                    @else
                        {{ $invoiceTitle }}
                    @endif
                </h2>
            </div>
        </div>

        @if ($isProforma)
            <div class="proforma-notice">
                <strong>Proforma Invoice Notice</strong>
                This booking is still in down payment status. This document is
                issued for payment reference only and must not be used as proof
                of full settlement.
            </div>
        @endif

        <div class="section-grid">
            <div class="section-cell">
                <p class="label">Billed To</p>
                <p class="customer-name">{{ $billedName ?: '-' }}</p>
                @if ($billedEmail)
                    <div class="muted">{{ $billedEmail }}</div>
                @endif
                @if ($billedPhone)
                    <div class="muted">{{ $billedPhone }}</div>
                @endif
            </div>
            <div class="section-cell right">
                <table class="info-table">
                    <tr>
                        <td class="key">Invoice Number</td>
                        <td class="invoice-meta-value">{{ $invoiceNumber }}</td>
                    </tr>
                    <tr>
                        <td class="key">Invoice Date</td>
                        <td>{{ $formatDate($invoiceDate) }}</td>
                    </tr>
                </table>
            </div>
        </div>

        <div class="panel">
            <div class="panel-title">Tour Details</div>
            <div class="panel-body">
                <p class="tour-name">{{ $tour?->name ?? '-' }}</p>
                <div class="tour-meta">
                    <div class="tour-meta-item">
                        <span class="meta-caption">Tour Code</span>
                        <span
                            class="meta-value"
                            >{{ $tour?->code ?? '-' }}</span
                        >
                    </div>
                    <div class="tour-meta-item">
                        <span class="meta-caption">Departure Date</span>
                        <span
                            class="meta-value"
                            >{{ $formatDate($booking->departure_date) }}</span
                        >
                    </div>
                    <div class="tour-meta-item">
                        <span class="meta-caption">Return Date</span>
                        <span
                            class="meta-value"
                            >{{ $formatDate($returnDate) }}</span
                        >
                    </div>
                    <div class="tour-meta-item">
                        <span class="meta-caption">Destination</span>
                        <span
                            class="meta-value"
                            >{{ $tour?->destination ?? '-' }}</span
                        >
                    </div>
                </div>
            </div>
        </div>

        <div class="panel">
            <div class="panel-title">Pax Breakdown</div>
            <div class="panel-body">
                <table class="pax-grid">
                    @foreach (collect($priceBreakdown)->chunk(2) as $row)
                        <tr>
                            @foreach ($row as $item)
                                <td>{{ $item['category'] }}</td>
                                <td class="pax-count">
                                    {{ $item['pax'] }} pax
                                </td>
                            @endforeach
                            @if ($row->count() === 1)
                                <td></td>
                                <td></td>
                            @endif
                        </tr>
                    @endforeach
                </table>
            </div>
        </div>

        <div class="details-title">Payment Details</div>
        <table class="payment-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th class="qty">Qty</th>
                    <th class="amount">Price</th>
                    <th class="amount">Discount</th>
                    <th class="amount">Amount</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($paymentDetails as $item)
                    <tr>
                        <td>{{ $item['description'] }}</td>
                        <td class="qty">{{ $item['quantity'] }}</td>
                        <td class="amount">
                            {{ $formatCurrency($item['unit_price']) }}
                        </td>
                        <td class="amount">
                            {{ $item['discount'] > 0 ? $formatCurrency($item['discount']) : '-' }}
                        </td>
                        <td class="amount strong">
                            {{ $formatCurrency($item['amount']) }}
                        </td>
                    </tr>
                @endforeach
                <tr class="table-total">
                    <td colspan="4">Payment Details Total</td>
                    <td class="amount">
                        {{ $formatCurrency($paymentDetailsTotal) }}
                    </td>
                </tr>
            </tbody>
        </table>

        <div class="summary-grid">
            <div class="summary-left">
                <div class="grand-box">
                    <p class="grand-label">Grand Total</p>
                    <div class="grand-amount">
                        {{ $formatCurrency($grandTotal) }}
                    </div>
                </div>
            </div>
            <div class="summary-right">
                <table class="summary-table">
                    <tr>
                        <td>Sub Total</td>
                        <td class="amount">
                            {{ $formatCurrency($paymentDetailsTotal) }}
                        </td>
                    </tr>
                    <tr>
                        <td>PPN {{ $formatPercent($vatRate) }}%</td>
                        <td class="amount">
                            {{ $formatCurrency($vatAmount) }}
                        </td>
                    </tr>
                    @foreach ($nonTaxableAddonSummaryRows as $addonSummary)
                        <tr>
                            <td>{{ $addonSummary['label'] }}</td>
                            <td class="amount">
                                {{ $formatCurrency($addonSummary['amount']) }}
                            </td>
                        </tr>
                    @endforeach
                    <tr>
                        <td>Platform Fee</td>
                        <td class="amount">
                            {{ $formatCurrency($platformFeeAmount) }}
                        </td>
                    </tr>
                    <tr class="total">
                        <td>Grand Total</td>
                        <td class="amount">
                            {{ $formatCurrency($grandTotal) }}
                        </td>
                    </tr>
                </table>
            </div>
        </div>

        @if ($isProforma && $paymentInstructions->isNotEmpty())
            <div class="instruction-panel">
                <div class="panel-title">Payment Instructions</div>
                <table class="instruction-table">
                    @foreach ($paymentInstructions as $instruction)
                        <tr>
                            <td class="key">{{ $instruction['label'] }}</td>
                            <td>{{ $instruction['value'] }}</td>
                        </tr>
                    @endforeach
                </table>
            </div>
        @endif

        <div class="paid-stamp">
            <div class="paid-left">
                <span
                    class="stamp {{ $isProforma ? 'proforma' : '' }}"
                    >{{ $invoiceStatus }}</span
                >
                @unless ($isProforma)
                    <div class="stamp-date">
                        Payment Date: {{ $formatDate($paymentDate) }}
                    </div>
                @endunless
            </div>
            <div class="paid-right">
                @if ($isProforma)
                    <div class="muted">Paid Amount</div>
                    <div class="payment-total paid-amount">
                        {{ $formatCurrency($paidAmount) }}
                    </div>
                    <div class="muted" style="margin-top: 8px">Remaining</div>
                    <div class="payment-total remaining-amount">
                        {{ $formatCurrency($remainingAmount) }}
                    </div>
                    @if (! empty($dueDate))
                        <div class="muted" style="margin-top: 6px">
                            Due Date: {{ $formatDate($dueDate) }}
                        </div>
                    @endif
                @endif
            </div>
        </div>

        <div class="footer">
            <div class="footer-left">
                Issued by {{ $agentName }} for {{ $billedName ?: '-' }}
            </div>
            <div class="footer-right">{{ $invoiceNumber }}</div>
        </div>
    </div>
</body>
</html>
