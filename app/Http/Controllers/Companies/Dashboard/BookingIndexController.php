<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Actions\Booking\ExpireBookingReservationsAction;
use App\Actions\Booking\FinalizeBookingPaymentAction;
use App\Actions\Booking\SyncAvailabilityAction;
use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateBookingRequest;
use App\Models\Booking;
use App\Models\BookingPassenger;
use App\Models\Company;
use App\Models\Payment;
use App\Models\TourPrice;
use App\Models\TourSchedule;
use App\Services\BookingPaymentReceiverService;
use App\Services\BookingPricingService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BookingIndexController extends Controller
{
    public function index(Company $company, Request $request): Response
    {
        app(ExpireBookingReservationsAction::class)->execute($company);

        $bookings = Booking::query()
            ->when(($company->type->value ?? $company->type) === 'vendor', function ($query) use ($company) {
                $query->where('vendor_id', $company->id);
            })
            ->when(($company->type->value ?? $company->type) === 'agent', function ($query) use ($company) {
                $query->where('agent_id', $company->id);
            })
            ->when($request->input('booking_number'), function ($query, $search) {
                $query->where('booking_number', 'ilike', "{$search}%");
            })
            ->when($request->input('contact_name'), function ($query, $search) {
                $query->where('contact_name', 'ilike', "{$search}%");
            })
            ->when($request->input('status'), function ($query, $status) {
                if (in_array($status, ['reserved', 'booking reserved'], true)) {
                    $query->whereIn('status', ['reserved', 'booking reserved']);

                    return;
                }

                $query->where('status', $status);
            })
            ->when($request->input('sort'), function ($query) {
                $sorts = explode(',', request('sort'));
                foreach ($sorts as $sort) {
                    if (str_starts_with($sort, '-')) {
                        $query->orderBy(substr($sort, 1), 'desc');
                    } else {
                        $query->orderBy($sort, 'asc');
                    }
                }
            }, function ($query) {
                $query->latest();
            })
            ->with([
                'tour:id,name,code',
                'vendor:id,name',
                'vendor.companySetting',
                'agent:id,name',
                'agent.companySetting',
                'user:id,name',
                'passengers:id,booking_id,price_category',
                'payments',
            ])
            ->withSum(['payments as paid_amount' => function ($query): void {
                $query->where('status', 'paid');
            }], 'amount')
            ->paginate();

        $paymentReceiverService = app(BookingPaymentReceiverService::class);

        $bookings->getCollection()->transform(function ($booking) use ($company, $paymentReceiverService) {
            $booking->commission_amount = $this->resolveCommissionAmount($booking);

            $paidAmount = (float) ($booking->paid_amount ?? 0);
            $booking->paid_amount = $paidAmount;
            $booking->remaining_balance = max(0, (float) $booking->grand_total - $paidAmount);
            $booking->manual_payment = $this->resolvePendingManualPayment($booking);
            $booking->can_review_manual_payment = $booking->manual_payment !== null
                && $paymentReceiverService->companyCanReviewManualPayment($company, $booking);

            return $booking;
        });

        return Inertia::render('companies/dashboard/bookings/index', [
            'data' => $bookings,
        ]);
    }

    public function show(Company $company, Booking $booking): Response
    {
        $booking = app(ExpireBookingReservationsAction::class)->expireIfDue($booking);

        return $this->renderBookingPage($company, $booking, 'companies/dashboard/bookings/show');
    }

    public function edit(Company $company, Booking $booking): Response
    {
        $booking = app(ExpireBookingReservationsAction::class)->expireIfDue($booking);

        return $this->renderBookingPage($company, $booking, 'companies/dashboard/bookings/edit');
    }

    public function invoice(Company $company, Booking $booking): HttpResponse
    {
        $companyType = $company->type->value ?? $company->type;

        abort_unless(in_array($companyType, ['agent', 'vendor'], true), 404);
        abort_unless(
            ($companyType === 'agent' && (int) $booking->agent_id === (int) $company->id)
            || ($companyType === 'vendor' && (int) $booking->vendor_id === (int) $company->id),
            404
        );
        abort_unless($booking->status === BookingStatus::FULL_PAYMENT, 404);

        $booking->load([
            'user',
            'agent.photo',
            'vendor.photo',
            'vendor.companySetting',
            'tour.company.companySetting',
            'passengers',
            'addons',
            'payments',
        ]);

        $paidPayments = $booking->payments
            ->filter(fn (Payment $payment): bool => $payment->status === PaymentStatus::PAID)
            ->sortBy(fn (Payment $payment): string => (string) ($payment->paid_at ?? $payment->created_at))
            ->values();

        abort_if($paidPayments->isEmpty(), 404);

        $paymentDate = $paidPayments->last()?->paid_at ?? $paidPayments->last()?->created_at;
        $invoiceSchedule = $this->resolveInvoiceSchedule($booking);
        $priceBreakdown = $this->buildInvoicePriceBreakdown($booking);
        $paymentDetails = $this->buildInvoicePaymentDetails($booking);
        $paymentDetailsTotal = (float) collect($paymentDetails)->sum('amount');
        $vatAmount = (float) $booking->tax_amount;
        $paymentReceiver = app(BookingPaymentReceiverService::class)->resolveForBooking($booking);
        $isVendorToAgentInvoice = $paymentReceiver['payment_mode'] === 'agent' && $booking->agent !== null;
        $invoiceGrandTotal = $isVendorToAgentInvoice
            ? $paymentDetailsTotal + $vatAmount
            : (float) $booking->grand_total;
        $invoiceNumber = $isVendorToAgentInvoice
            ? 'V2A-'.str_pad((string) $booking->vendor_id, 4, '0', STR_PAD_LEFT).'-'.$booking->booking_number
            : $booking->booking_number;
        $issuer = $booking->vendor ?? $booking->tour?->company;
        $customerAddress = $booking->user?->address;
        $billedTo = $isVendorToAgentInvoice ? ($booking->agent ?? $company) : null;
        $vatRate = $this->resolveInvoiceVatRate($booking);
        $filename = 'Invoice_'.$invoiceNumber.'.pdf';

        $pdf = Pdf::setOption(['isRemoteEnabled' => true])
            ->loadView('exports.booking-invoice', [
                'booking' => $booking,
                'agent' => $issuer,
                'logoSrc' => $this->resolveCompanyLogoSrc($issuer),
                'customerName' => $billedTo?->name ?? ($booking->user?->name ?: $booking->contact_name),
                'billedToName' => $billedTo?->name,
                'billedToEmail' => $billedTo?->email,
                'billedToPhone' => $billedTo?->customer_service_phone ?: $billedTo?->phone,
                'billedToAddress' => $billedTo?->address ?? $customerAddress,
                'paymentDate' => $paymentDate,
                'returnDate' => $invoiceSchedule?->return_date,
                'paidAmount' => (float) $paidPayments->sum('amount'),
                'invoicePaidAmount' => $isVendorToAgentInvoice ? $invoiceGrandTotal : (float) $paidPayments->sum('amount'),
                'priceBreakdown' => $priceBreakdown,
                'paymentDetails' => $paymentDetails,
                'paymentDetailsTotal' => $paymentDetailsTotal,
                'vatRate' => $vatRate,
                'otherChargeAmount' => $isVendorToAgentInvoice ? 0 : (float) $booking->platform_fee,
                'discountAmount' => 0,
                'invoiceGrandTotal' => $invoiceGrandTotal,
                'invoiceNumber' => $invoiceNumber,
            ])
            ->setPaper('A4', 'portrait');

        return $pdf->stream($filename);
    }

    public function update(Company $company, Booking $booking, UpdateBookingRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($booking, $validated): void {
            $booking->loadMissing('tour.company.companySetting');
            $quote = app(BookingPricingService::class)->quoteForBookingData(
                $booking->tour,
                $booking->departure_date,
                $validated['passengers'],
                $validated['addons'] ?? [],
                (float) ($booking->vendor?->companySetting?->minimum_vat ?? $booking->tour?->company?->companySetting?->minimum_vat ?? 11),
                $booking->agent_id !== null,
            );
            $totals = app(BookingPricingService::class)->bookingTotalsFromQuote($quote);

            $booking->update([
                'contact_name' => $validated['contact_name'],
                'contact_email' => $validated['contact_email'],
                'contact_phone' => $validated['contact_phone'],
                'contact_notes' => $validated['contact_notes'] ?? null,
                'pax_adult' => $validated['pax_adult'],
                'pax_child' => $validated['pax_child'],
                'pax_infant' => $validated['pax_infant'],
                'total_price' => $totals['total_price'],
                'tax_amount' => $totals['tax_amount'],
                'platform_fee' => $totals['platform_fee'],
                'commission_amount' => $totals['commission_amount'],
                'grand_total' => $totals['grand_total'],
            ]);

            $retainedPassengerIds = collect($quote['passengers'])
                ->pluck('id')
                ->filter()
                ->map(fn ($id) => (int) $id)
                ->values();

            if ($retainedPassengerIds->isNotEmpty()) {
                $booking->passengers()
                    ->whereNotIn('id', $retainedPassengerIds)
                    ->delete();
            } else {
                $booking->passengers()->delete();
            }

            foreach ($quote['passengers'] as $passengerData) {
                $payload = [
                    'title' => $passengerData['title'] ?? null,
                    'first_name' => $passengerData['first_name'],
                    'last_name' => $passengerData['last_name'] ?? null,
                    'gender' => $passengerData['gender'] ?? null,
                    'dob' => $passengerData['dob'] ?? null,
                    'pob' => $passengerData['pob'] ?? null,
                    'nationality' => $passengerData['nationality'] ?? null,
                    'passport_number' => $passengerData['passport_number'] ?? null,
                    'passport_issue_date' => $passengerData['passport_issue_date'] ?? null,
                    'passport_expiry_date' => $passengerData['passport_expiry_date'] ?? null,
                    'visa_number' => $passengerData['visa_number'] ?? null,
                    'price_category' => $passengerData['price_category'] ?? null,
                    'price_amount' => $passengerData['price_amount'] ?? null,
                    'room_type' => $passengerData['room_type'] ?? null,
                    'room_number' => $passengerData['room_number'] ?? null,
                    'note' => $passengerData['note'] ?? null,
                ];

                if (! empty($passengerData['id'])) {
                    BookingPassenger::query()
                        ->where('id', $passengerData['id'])
                        ->where('booking_id', $booking->id)
                        ->update($payload);

                    continue;
                }

                $booking->passengers()->create($payload);
            }

            if (array_key_exists('rooms', $validated)) {
                $booking->rooms()->delete();
                $booking->rooms()->createMany($validated['rooms'] ?? []);
            }

            if (array_key_exists('addons', $validated)) {
                $booking->addons()->delete();
                $booking->addons()->createMany($quote['addons'] ?? []);
            }
        });

        return back()->with('success', 'Booking updated successfully.');
    }

    public function acceptManualPayment(Company $company, Booking $booking, Payment $payment): RedirectResponse
    {
        $this->assertPaymentReviewable($company, $booking, $payment);

        DB::transaction(function () use ($booking, $payment): void {
            app(FinalizeBookingPaymentAction::class)
                ->assertCanFinalizeIncomingPaidPayment($booking->fresh(), $payment->fresh());

            $payment->update([
                'status' => PaymentStatus::PAID,
                'paid_at' => now(),
            ]);

            $booking->update([
                'payment_mode' => 'manual',
            ]);

            app(FinalizeBookingPaymentAction::class)->execute($booking->fresh(), $payment->fresh());
        });

        return back()->with('success', 'Manual payment accepted.');
    }

    public function declineManualPayment(Company $company, Booking $booking, Payment $payment): RedirectResponse
    {
        $this->assertPaymentReviewable($company, $booking, $payment);

        DB::transaction(function () use ($booking, $payment): void {
            $payment->update([
                'status' => PaymentStatus::FAILED,
                'payload' => array_merge($payment->payload ?? [], [
                    'declined_at' => now()->toISOString(),
                ]),
            ]);

            $booking->update([
                'status' => BookingStatus::CANCELLED,
                'reserved_expires_at' => null,
            ]);
        });

        app(SyncAvailabilityAction::class)->executeForBooking($booking->fresh());

        return back()->with('success', 'Manual payment declined and booking cancelled.');
    }

    /**
     * Shared method to load booking data with all required relationships
     * and supplemental data (tourPrices, addOns) for the wizard view.
     */
    private function renderBookingPage(Company $company, Booking $booking, string $page): Response
    {
        $booking->load([
            'tour',
            'tour.company.companySetting',
            'vendor:id,name,payment_mode,commission',
            'agent:id,name',
            'user:id,name',
            'passengers',
            'rooms',
            'addons',
        ]);

        $tour = $booking->tour;

        $tourPrices = collect();
        $addOns = [];

        if ($tour) {
            $schedule = \App\Models\TourSchedule::where('tour_code', $tour->code)
                ->whereDate('departure_date', $booking->departure_date)
                ->first();

            $tourPrices = TourPrice::with('priceCategory:id,name,description')
                ->where('tour_code', $tour->code)
                ->when($schedule, function ($query) use ($schedule) {
                    $query->where('schedule_id', $schedule->id);
                })
                ->orderBy('id')
                ->get()
                ->unique('price_category_id')
                ->map(function ($price) {
                    return [
                        'tourPriceId' => $price->id,
                        'categoryName' => $price->priceCategory?->name ?? 'Single',
                        'description' => $price->priceCategory?->description ?? '',
                        'price' => (float) $price->price,
                        'promotionRate' => (float) $price->promotion_rate,
                        'promotion' => (float) $price->promotion,
                        'commissionRate' => (float) $price->commission_rate,
                        'commission' => (float) $price->commission,
                    ];
                })
                ->values();

            if ($schedule) {
                $bookingAddOns = $booking->addons
                    ->keyBy(fn ($addon) => strtolower((string) $addon->name));

                $addOns = \App\Models\TourAddOn::where('schedule_id', $schedule->id)
                    ->where('tour_id', $tour->id)
                    ->get()
                    ->map(function ($addon) use ($bookingAddOns) {
                        $savedAddon = $bookingAddOns->get(strtolower((string) $addon->description));
                        $unitPrice = (float) $addon->price;

                        return [
                            'key' => 'addon_'.$addon->id,
                            'label' => $addon->description,
                            'unitPrice' => $unitPrice,
                            'qty' => $savedAddon
                                ? (int) max(1, round((float) $savedAddon->price / max($unitPrice, 1)))
                                : ($addon->edit_status ? 0 : 1),
                            'hasQty' => (bool) $addon->edit_status,
                        ];
                    })
                    ->values()
                    ->toArray();

                $knownAddOnLabels = collect($addOns)
                    ->pluck('label')
                    ->map(fn ($label) => strtolower((string) $label))
                    ->all();

                foreach ($booking->addons as $bookingAddon) {
                    if (in_array(strtolower((string) $bookingAddon->name), $knownAddOnLabels, true)) {
                        continue;
                    }

                    $addOns[] = [
                        'key' => 'booking_addon_'.$bookingAddon->id,
                        'label' => $bookingAddon->name,
                        'unitPrice' => (float) $bookingAddon->price,
                        'qty' => 1,
                        'hasQty' => true,
                    ];
                }
            }
        }

        return Inertia::render($page, [
            'booking' => $booking,
            'tourPrices' => $tourPrices,
            'addOns' => $addOns,
            'minimumDownPaymentPct' => (float) ($tour?->company?->companySetting?->minimum_down_payment ?? 50),
            'minimumVatPct' => (float) ($tour?->company?->companySetting?->minimum_vat ?? 11),
        ]);
    }

    private function buildInvoicePriceBreakdown(Booking $booking): array
    {
        $schedule = $this->resolveInvoiceSchedule($booking);

        $categories = $schedule
            ? TourPrice::query()
                ->with('priceCategory:id,name')
                ->where('schedule_id', $schedule->id)
                ->orderBy('id')
                ->get()
                ->map(fn (TourPrice $price): string => (string) ($price->priceCategory?->name ?? 'Category '.$price->price_category_id))
                ->filter()
                ->unique()
                ->values()
            : collect();

        if ($categories->isEmpty()) {
            $categories = $booking->passengers
                ->pluck('price_category')
                ->filter()
                ->unique()
                ->values();
        }

        $bookedCounts = $booking->passengers
            ->groupBy(fn ($passenger): string => (string) $passenger->price_category)
            ->map(fn (Collection $passengers): int => $passengers->count());

        return $categories
            ->map(fn (string $category): array => [
                'category' => $category,
                'pax' => (int) ($bookedCounts->get($category) ?? 0),
            ])
            ->values()
            ->all();
    }

    private function buildInvoicePaymentDetails(Booking $booking): array
    {
        $schedule = $this->resolveInvoiceSchedule($booking);

        $tourPrices = $schedule
            ? TourPrice::query()
                ->with('priceCategory:id,name')
                ->where('schedule_id', $schedule->id)
                ->get()
                ->mapWithKeys(fn (TourPrice $price): array => [
                    (string) ($price->priceCategory?->name ?? 'Category '.$price->price_category_id) => (float) $price->price,
                ])
            : collect();

        $passengerRows = $booking->passengers
            ->groupBy(fn ($passenger): string => (string) ($passenger->price_category ?: 'Tour Package'))
            ->map(function (Collection $passengers, string $category) use ($tourPrices): array {
                $quantity = $passengers->count();
                $amount = (float) $passengers->sum('price_amount');
                $unitPrice = (float) ($tourPrices->get($category) ?? ($quantity > 0 ? $amount / $quantity : 0));
                $grossAmount = $unitPrice * $quantity;
                $discount = max(0.0, $grossAmount - $amount);

                return [
                    'description' => $category,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'discount' => $discount,
                    'amount' => $amount,
                ];
            })
            ->values();

        $addonRows = $booking->addons
            ->map(fn ($addon): array => [
                'description' => $addon->name ?: 'Add-on',
                'quantity' => 1,
                'unit_price' => (float) $addon->price,
                'discount' => 0.0,
                'amount' => (float) $addon->price,
            ]);

        return $passengerRows
            ->concat($addonRows)
            ->values()
            ->all();
    }

    private function resolveInvoiceSchedule(Booking $booking): ?TourSchedule
    {
        if (! $booking->tour_id || ! $booking->vendor_id || ! $booking->departure_date) {
            return null;
        }

        return TourSchedule::query()
            ->where('tour_id', $booking->tour_id)
            ->where('company_id', $booking->vendor_id)
            ->whereDate('departure_date', Carbon::parse($booking->departure_date)->toDateString())
            ->first();
    }

    private function resolveInvoiceVatRate(Booking $booking): float
    {
        $settingsRate = $booking->vendor?->companySetting?->minimum_vat
            ?? $booking->tour?->company?->companySetting?->minimum_vat;

        if ($settingsRate !== null) {
            return (float) $settingsRate;
        }

        $taxBase = (float) $booking->total_price;

        if ($taxBase <= 0) {
            return 0.0;
        }

        return round(((float) $booking->tax_amount / $taxBase) * 100, 2);
    }

    private function resolveCompanyLogoSrc(mixed $company): ?string
    {
        $url = $company?->photo_url;

        if (! $url) {
            return null;
        }

        $path = public_path(ltrim((string) $url, '/'));

        if (! file_exists($path)) {
            return $url;
        }

        $mime = mime_content_type($path) ?: 'image/png';

        return 'data:'.$mime.';base64,'.base64_encode((string) file_get_contents($path));
    }

    /**
     * @return array<string, mixed>|null
     */
    private function resolvePendingManualPayment(Booking $booking): ?array
    {
        $manualPayment = $booking->payments
            ->first(function (Payment $payment): bool {
                return $payment->provider === 'manual'
                    && $payment->payment_method === 'bank_transfer'
                    && $payment->status === PaymentStatus::PENDING;
            });

        if (! $manualPayment) {
            return null;
        }

        $proofPath = data_get($manualPayment->payload, 'proof_path');

        return [
            'id' => $manualPayment->id,
            'sender_bank_name' => data_get($manualPayment->payload, 'sender_bank'),
            'sender_account_number' => data_get($manualPayment->payload, 'sender_account'),
            'transfer_amount' => (float) $manualPayment->amount,
            'proof_path' => $proofPath,
            'proof_url' => $proofPath ? Storage::disk('public')->url($proofPath) : null,
            'payment_type' => data_get($manualPayment->payload, 'payment_type'),
        ];
    }

    private function assertPaymentReviewable(Company $company, Booking $booking, Payment $payment): void
    {
        $companyType = $company->type->value ?? $company->type;
        $belongsToCompany = $companyType === 'vendor'
            ? (int) $booking->vendor_id === (int) $company->id
            : (int) $booking->agent_id === (int) $company->id;

        abort_unless($belongsToCompany, 404);
        abort_unless($payment->payable_type === Booking::class, 404);
        abort_unless((int) $payment->payable_id === (int) $booking->id, 404);
        abort_unless(
            app(BookingPaymentReceiverService::class)->companyCanReviewManualPayment($company, $booking),
            403
        );
        abort_unless($payment->provider === 'manual', 422);
        abort_unless($payment->payment_method === 'bank_transfer', 422);
        abort_unless($payment->status === PaymentStatus::PENDING, 422);
    }

    private function resolveCommissionAmount(Booking $booking): float
    {
        $commissionAmount = (float) ($booking->commission_amount ?? 0);

        if ($commissionAmount > 0) {
            return $commissionAmount;
        }

        $schedule = TourSchedule::query()
            ->where('tour_id', $booking->tour_id)
            ->whereDate('departure_date', $booking->departure_date)
            ->first();

        if (! $schedule || ! $booking->tour) {
            return 0;
        }

        $tourPrice = TourPrice::query()
            ->where('tour_code', $booking->tour->code)
            ->where('schedule_id', $schedule->id)
            ->first();

        if (! $tourPrice) {
            return 0;
        }

        $paxCount = (int) $booking->pax_adult + (int) $booking->pax_child;

        if ((float) $tourPrice->commission > 0) {
            return (float) $tourPrice->commission * $paxCount;
        }

        if ((float) $tourPrice->commission_rate > 0) {
            return ((float) $tourPrice->commission_rate / 100)
                * (float) $tourPrice->price
                * $paxCount;
        }

        return 0;
    }
}
