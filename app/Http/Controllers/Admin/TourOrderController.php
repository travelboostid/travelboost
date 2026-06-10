<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexTourOrderRequest;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TourOrderController extends Controller
{
    public function index(IndexTourOrderRequest $request): Response
    {
        $validated = $request->validated();

        $data = Booking::query()
            ->with(['vendor', 'agent', 'tour'])
            ->withSum(['payments as paid_amount' => function ($query): void {
                $query->where('status', 'paid');
            }], 'amount')
            ->when($validated['booking_number'] ?? null, fn ($query, $bookingNumber) => $query->where('booking_number', 'ilike', "{$bookingNumber}%"))
            ->when($validated['contact_name'] ?? null, fn ($query, $contactName) => $query->where('contact_name', 'ilike', "%{$contactName}%"))
            ->when($validated['status'] ?? null, fn ($query, $statuses) => $query->whereIn('status', $statuses))
            ->when($validated['vendor'] ?? null, fn ($query, $vendorIds) => $query->whereIn('vendor_id', $vendorIds))
            ->when($validated['agent'] ?? null, fn ($query, $agentIds) => $query->whereIn('agent_id', $agentIds))
            ->when($validated['created_at'] ?? null, function ($query, $createdAt): void {
                $this->applyDateFilter($query, 'created_at', $createdAt);
            })
            ->when($validated['departure_date'] ?? null, function ($query, $departureDate): void {
                $this->applyDateFilter($query, 'departure_date', $departureDate);
            })
            ->when($validated['sort'] ?? null, function ($query, $sort): void {
                foreach (explode(',', $sort) as $item) {
                    $direction = str_starts_with($item, '-') ? 'desc' : 'asc';
                    $field = ltrim($item, '-');
                    $query->orderBy($field, $direction);
                }
            })
            ->paginate($validated['per_page'] ?? 10);

        $data->through(fn (Booking $booking): array => $this->orderListItem($booking));

        return Inertia::render('admin/tours/orders/index', [
            'data' => $data,
        ]);
    }

    public function exportAsCsv(Request $request): StreamedResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'string'],
        ]);

        $bookingIds = explode(',', $validated['ids']);

        return response()->streamDownload(
            function () use ($bookingIds): void {
                $file = fopen('php://output', 'w');

                fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

                fputcsv($file, [
                    'ID',
                    'Booking Number',
                    'Invoice Number',
                    'Customer',
                    'Vendor',
                    'Agent',
                    'Tour',
                    'Departure',
                    'Status',
                    'Grand Total',
                    'Paid Amount',
                    'Created At',
                ]);

                Booking::query()
                    ->with(['vendor', 'agent', 'tour'])
                    ->withSum(['payments as paid_amount' => function ($query): void {
                        $query->where('status', 'paid');
                    }], 'amount')
                    ->whereIn('id', $bookingIds)
                    ->orderBy('id')
                    ->cursor()
                    ->each(function (Booking $booking) use ($file): void {
                        fputcsv($file, [
                            $booking->id,
                            $booking->booking_number,
                            $booking->invoice_number,
                            $booking->contact_name,
                            $booking->vendor?->name,
                            $booking->agent?->name,
                            $booking->tour?->name,
                            $booking->departure_date?->toDateString(),
                            $booking->status?->value ?? $booking->status,
                            $booking->grand_total,
                            $booking->paid_amount ?? 0,
                            $booking->created_at?->toDateTimeString(),
                        ]);
                    });

                fclose($file);
            },
            'tour-orders.csv',
            ['Content-Type' => 'text/csv'],
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function orderListItem(Booking $booking): array
    {
        return [
            'id' => $booking->id,
            'booking_number' => $booking->booking_number,
            'invoice_number' => $booking->invoice_number,
            'contact_name' => $booking->contact_name,
            'contact_email' => $booking->contact_email,
            'contact_phone' => $booking->contact_phone,
            'contact_notes' => $booking->contact_notes,
            'status' => $booking->status?->value ?? $booking->status,
            'departure_date' => $booking->departure_date,
            'grand_total' => (float) $booking->grand_total,
            'paid_amount' => (float) ($booking->paid_amount ?? 0),
            'pax_adult' => (int) $booking->pax_adult,
            'pax_child' => (int) $booking->pax_child,
            'pax_infant' => (int) $booking->pax_infant,
            'payment_mode' => $booking->payment_mode,
            'created_at' => $booking->created_at,
            'vendor' => $booking->vendor ? [
                'id' => $booking->vendor->id,
                'name' => $booking->vendor->name,
                'username' => $booking->vendor->username,
            ] : null,
            'agent' => $booking->agent ? [
                'id' => $booking->agent->id,
                'name' => $booking->agent->name,
                'username' => $booking->agent->username,
            ] : null,
            'tour' => $booking->tour ? [
                'id' => $booking->tour->id,
                'name' => $booking->tour->name,
                'code' => $booking->tour->code,
            ] : null,
        ];
    }

    private function applyDateFilter($query, string $column, string $value): void
    {
        $range = explode(',', $value);

        if (count($range) === 2) {
            $from = Carbon::createFromTimestamp(((int) $range[0]) / 1000);
            $to = Carbon::createFromTimestamp(((int) $range[1]) / 1000);
            $query->whereBetween($column, [$from, $to]);

            return;
        }

        $date = Carbon::createFromTimestamp(((int) $range[0]) / 1000);
        $query->whereDate($column, $date);
    }
}
