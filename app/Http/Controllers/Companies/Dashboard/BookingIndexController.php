<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Actions\Booking\ExpireBookingReservationsAction;
use App\Actions\Booking\FinalizeBookingPaymentAction;
use App\Actions\Booking\NotifyBookingPaymentEventAction;
use App\Actions\Booking\SyncAvailabilityAction;
use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateBookingRequest;
use App\Models\BankAccount;
use App\Models\Booking;
use App\Models\BookingActionRequest;
use App\Models\BookingPassenger;
use App\Models\Company;
use App\Models\Payment;
use App\Models\Role;
use App\Models\TourAddOn;
use App\Models\TourAvailability;
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
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class BookingIndexController extends Controller
{
    /**
     * @var array<string, string>
     */
    private array $roleLabelCache = [];

    /**
     * @var list<string>
     */
    private const CANCELLABLE_STATUSES = [
        'awaiting payment',
        'booking reserved',
        'waiting payment approval',
        'down payment',
        'full payment',
    ];

    /**
     * @var list<string>
     */
    private const REFUNDABLE_STATUSES = [
        'down payment',
        'full payment',
    ];

    /**
     * @var list<string>
     */
    private const BOOKING_PAYMENT_TYPES = [
        'down_payment',
        'full_payment',
    ];

    /**
     * @var list<string>
     */
    private const INVOICEABLE_STATUSES = [
        'down payment',
        'full payment',
    ];

    /**
     * @var list<string>
     */
    private const FOLLOW_UP_STATUSES = [
        'awaiting payment',
        'waiting payment approval',
        'down payment',
        'full payment',
    ];

    private const FOLLOW_UP_DUE_SOON_DAYS = 7;

    public function index(Company $company, Request $request): Response|RedirectResponse
    {
        if (! $this->userCanAccessCompanyDashboard($request->user(), $company)) {
            return redirect('/');
        }

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
                'inputByUser:id,name',
                'inputByCompany:id,name,type',
                'passengers:id,booking_id,price_category,price_amount',
                'payments',
                'actionRequests' => fn ($query) => $query->where('status', 'pending')->latest(),
            ])
            ->withSum(['payments as paid_amount' => function ($query): void {
                $query->where('status', 'paid');
            }], 'amount')
            ->paginate();

        $paymentReceiverService = app(BookingPaymentReceiverService::class);

        $followupSummary = $this->emptyFollowupSummary();

        $bookings->getCollection()->transform(function ($booking) use ($company, $paymentReceiverService, &$followupSummary) {
            $booking->commission_amount = $this->resolveCommissionAmount($booking);

            $paidAmount = (float) ($booking->paid_amount ?? 0);
            $booking->paid_amount = $paidAmount;
            $booking->remaining_balance = max(0, (float) $booking->grand_total - $paidAmount);
            $paymentFollowup = $this->paymentFollowupPayload($company, $booking);
            $documentFollowup = $this->documentFollowupPayload($company, $booking);
            $booking->payment_followup = $paymentFollowup;
            $booking->document_followup = $documentFollowup;
            $booking->input_by = $this->inputByPayload($booking);
            $this->addToFollowupSummary($followupSummary, $paymentFollowup, $documentFollowup);
            $booking->down_payment_detail = $this->paymentDetailPayload($booking, 'down_payment', $paymentReceiverService);
            $booking->full_payment_detail = $this->paymentDetailPayload($booking, 'full_payment', $paymentReceiverService);
            $booking->manual_payment = $this->resolvePendingManualPayment($booking);
            $booking->can_review_manual_payment = $booking->manual_payment !== null
                && $paymentReceiverService->companyCanReviewManualPayment($company, $booking);
            $latestPayment = $booking->payments
                ->sortByDesc('created_at')
                ->first();
            $paymentReceiver = $paymentReceiverService->resolveForBooking($booking);
            $booking->payment_receiver_type = data_get($latestPayment?->payload, 'payment_receiver_type')
                ?: $paymentReceiver['receiver_type'];
            $booking->payment_receiver_company_id = data_get($latestPayment?->payload, 'payment_receiver_company_id')
                ?: $paymentReceiver['receiver_company']?->id;
            $booking->invoice_options = $this->invoiceOptions($company, $booking, $paymentReceiver['payment_mode']);
            $pendingActionRequest = $booking->actionRequests->first();
            $booking->pending_action_request = $pendingActionRequest
                ? [
                    'id' => $pendingActionRequest->id,
                    'target_action' => $pendingActionRequest->target_action,
                    'status' => $pendingActionRequest->status,
                ]
                : null;
            $booking->can_cancel = in_array($this->bookingStatusValue($booking), self::CANCELLABLE_STATUSES, true);
            $booking->can_refund = in_array($this->bookingStatusValue($booking), self::REFUNDABLE_STATUSES, true);
            $booking->can_reorder = $this->canReorderBooking($booking);

            return $booking;
        });

        return Inertia::render('companies/dashboard/bookings/index', [
            'data' => $bookings,
            'followupSummary' => $followupSummary,
        ]);
    }

    public function show(Company $company, Booking $booking): Response
    {
        $this->assertCompanyCanAccessBooking($company, $booking);
        $booking = app(ExpireBookingReservationsAction::class)->expireIfDue($booking);

        return $this->renderBookingPage($company, $booking, 'companies/dashboard/bookings/show');
    }

    public function edit(Company $company, Booking $booking): Response
    {
        $this->assertCompanyCanAccessBooking($company, $booking);
        $booking = app(ExpireBookingReservationsAction::class)->expireIfDue($booking);

        return $this->renderBookingPage($company, $booking, 'companies/dashboard/bookings/edit');
    }

    public function reorder(Company $company, Booking $booking): RedirectResponse
    {
        $this->assertCompanyCanAccessBooking($company, $booking);
        $booking = app(ExpireBookingReservationsAction::class)->expireIfDue($booking);
        $booking->loadMissing(['tour', 'vendor.companySetting']);

        abort_unless($this->canReorderBooking($booking), 422);

        DB::transaction(function () use ($booking): void {
            $booking->update([
                'status' => BookingStatus::AWAITING_PAYMENT,
                'reserved_type' => 'system',
                'reserved_expires_at' => null,
            ]);
        });

        app(SyncAvailabilityAction::class)->executeForBooking($booking->fresh());

        return to_route('companies.dashboard.bookings.create', [
            'company' => $company,
            'tour' => $booking->tour,
            'date' => Carbon::parse($booking->departure_date)->toDateString(),
            'booking_number' => $booking->booking_number,
        ]);
    }

    public function invoice(Company $company, Booking $booking, Request $request): HttpResponse
    {
        $companyType = $company->type->value ?? $company->type;

        abort_unless(in_array($companyType, ['agent', 'vendor'], true), 404);
        abort_unless(
            ($companyType === 'agent' && (int) $booking->agent_id === (int) $company->id)
            || ($companyType === 'vendor' && (int) $booking->vendor_id === (int) $company->id),
            404
        );
        abort_unless(in_array($this->bookingStatusValue($booking), self::INVOICEABLE_STATUSES, true), 404);

        $booking->load([
            'user',
            'agent.photo',
            'agent.companySetting',
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
        $invoiceOptions = $this->invoiceOptions($company, $booking, $paymentReceiver['payment_mode']);
        $requestedInvoiceType = $request->string('type')->toString();
        $invoiceType = collect($invoiceOptions)
            ->pluck('type')
            ->first(fn (string $type): bool => $type === $requestedInvoiceType)
            ?? data_get($invoiceOptions, '0.type');

        abort_unless($invoiceType, 404);

        $isVendorToAgentInvoice = $invoiceType === 'vendor_to_agent';
        $isAgentToCustomerInvoice = $invoiceType === 'agent_to_customer';
        $isCustomerInvoice = ! $isVendorToAgentInvoice;
        $isProforma = $this->bookingStatusValue($booking) === BookingStatus::DOWN_PAYMENT->value;
        $invoiceGrandTotal = $isVendorToAgentInvoice
            ? $paymentDetailsTotal + $vatAmount
            : (float) $booking->grand_total;
        $invoiceNumber = $isVendorToAgentInvoice
            ? 'V2A-'.str_pad((string) $booking->vendor_id, 4, '0', STR_PAD_LEFT).'-'.$booking->booking_number
            : $booking->booking_number;
        $issuer = $isAgentToCustomerInvoice
            ? $booking->agent
            : ($booking->vendor ?? $booking->tour?->company);
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
                'invoicePaidAmount' => $isVendorToAgentInvoice && ! $isProforma
                    ? $invoiceGrandTotal
                    : (float) $paidPayments->sum('amount'),
                'priceBreakdown' => $priceBreakdown,
                'paymentDetails' => $paymentDetails,
                'paymentDetailsTotal' => $paymentDetailsTotal,
                'vatRate' => $vatRate,
                'otherChargeAmount' => $isCustomerInvoice ? (float) $booking->platform_fee : 0,
                'discountAmount' => 0,
                'invoiceGrandTotal' => $invoiceGrandTotal,
                'invoiceNumber' => $invoiceNumber,
                'isProforma' => $isProforma,
                'paymentInstructions' => $isProforma
                    ? $this->proformaPaymentInstructions($issuer, $invoiceType)
                    : [],
            ])
            ->setPaper('A4', 'portrait');

        return $pdf->stream($filename);
    }

    public function update(Company $company, Booking $booking, UpdateBookingRequest $request): RedirectResponse
    {
        $this->assertCompanyCanAccessBooking($company, $booking);
        abort_unless($this->resolveEditMode($booking->loadMissing('passengers')) === 'full', 403);

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
                'paid_at' => $this->manualPaymentPaidAt($payment),
            ]);

            $booking->update([
                'payment_mode' => 'manual',
            ]);

            app(FinalizeBookingPaymentAction::class)->execute($booking->fresh(), $payment->fresh());
            app(NotifyBookingPaymentEventAction::class)->execute($booking->fresh(), 'manual_payment_accepted', $payment->fresh());
        });

        return back()->with('success', 'Manual payment accepted.');
    }

    public function cancel(Company $company, Booking $booking, Request $request): RedirectResponse
    {
        return $this->handleBookingAction($company, $booking, 'cancel', $request);
    }

    public function refund(Company $company, Booking $booking, Request $request): RedirectResponse
    {
        return $this->handleBookingAction($company, $booking, 'refund', $request);
    }

    public function actionRequests(Company $company): Response
    {
        abort_unless(($company->type->value ?? $company->type) === 'vendor', 404);

        $requests = BookingActionRequest::query()
            ->with([
                'booking:id,booking_number,contact_name,status,tour_id,vendor_id,agent_id,grand_total,departure_date',
                'booking.tour:id,name,code',
                'requesterCompany:id,name,username,type',
                'requesterUser:id,name,email',
            ])
            ->where('status', 'pending')
            ->whereHas('booking', fn ($query) => $query->where('vendor_id', $company->id))
            ->latest()
            ->paginate(15)
            ->through(fn (BookingActionRequest $request): array => [
                'id' => $request->id,
                'target_action' => $request->target_action,
                'status' => $request->status,
                'reason' => $request->reason,
                'created_at' => $request->created_at?->toIso8601String(),
                'booking' => [
                    'id' => $request->booking?->id,
                    'booking_number' => $request->booking?->booking_number,
                    'contact_name' => $request->booking?->contact_name,
                    'status' => $this->bookingStatusValue($request->booking),
                    'grand_total' => $request->booking?->grand_total,
                    'departure_date' => $request->booking?->departure_date?->toDateString(),
                    'tour' => $request->booking?->tour
                        ? [
                            'id' => $request->booking->tour->id,
                            'name' => $request->booking->tour->name,
                            'code' => $request->booking->tour->code,
                        ]
                        : null,
                ],
                'requester_company' => $request->requesterCompany
                    ? [
                        'id' => $request->requesterCompany->id,
                        'name' => $request->requesterCompany->name,
                        'username' => $request->requesterCompany->username,
                    ]
                    : null,
                'requester_user' => $request->requesterUser
                    ? [
                        'id' => $request->requesterUser->id,
                        'name' => $request->requesterUser->name,
                        'email' => $request->requesterUser->email,
                    ]
                    : null,
            ]);

        return Inertia::render('companies/dashboard/bookings/action-requests', [
            'requests' => $requests,
        ]);
    }

    public function approveActionRequest(Company $company, BookingActionRequest $bookingActionRequest): RedirectResponse
    {
        $bookingActionRequest->loadMissing('booking');
        $this->assertCanReviewBookingActionRequest($company, $bookingActionRequest);
        abort_unless($bookingActionRequest->status === 'pending', 422);

        $this->applyBookingAction($bookingActionRequest->booking, $bookingActionRequest->target_action);

        $bookingActionRequest->update([
            'status' => 'approved',
            'reviewer_company_id' => $company->id,
            'reviewer_user_id' => request()->user()?->id,
            'reviewed_at' => now(),
        ]);

        return back()->with('success', 'Booking action request approved.');
    }

    public function rejectActionRequest(Company $company, BookingActionRequest $bookingActionRequest): RedirectResponse
    {
        $bookingActionRequest->loadMissing('booking');
        $this->assertCanReviewBookingActionRequest($company, $bookingActionRequest);
        abort_unless($bookingActionRequest->status === 'pending', 422);

        $bookingActionRequest->update([
            'status' => 'rejected',
            'reviewer_company_id' => $company->id,
            'reviewer_user_id' => request()->user()?->id,
            'reviewed_at' => now(),
        ]);

        return back()->with('success', 'Booking action request rejected.');
    }

    private function handleBookingAction(Company $company, Booking $booking, string $action, Request $request): RedirectResponse
    {
        $this->assertCompanyCanAccessBooking($company, $booking);
        $this->assertBookingActionAllowed($booking, $action);

        $companyType = $company->type->value ?? $company->type;

        if ($companyType === 'agent') {
            BookingActionRequest::query()->updateOrCreate(
                [
                    'booking_id' => $booking->id,
                    'requester_company_id' => $company->id,
                    'target_action' => $action,
                    'status' => 'pending',
                ],
                [
                    'requester_user_id' => $request->user()->id,
                    'reason' => $request->string('reason')->trim()->toString() ?: null,
                ]
            );

            return back()->with('success', ucfirst($action).' request sent to vendor.');
        }

        abort_unless($companyType === 'vendor', 404);

        $this->applyBookingAction($booking, $action);

        return back()->with('success', 'Booking '.($action === 'cancel' ? 'cancelled' : 'refunded').'.');
    }

    private function applyBookingAction(Booking $booking, string $action): void
    {
        $lockedBooking = DB::transaction(function () use ($booking, $action): Booking {
            $lockedBooking = Booking::query()
                ->whereKey($booking->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->assertBookingActionAllowed($lockedBooking, $action);

            $lockedBooking->update([
                'status' => $action === 'cancel'
                    ? BookingStatus::CANCELLED
                    : BookingStatus::REFUNDED,
                'reserved_expires_at' => null,
            ]);

            if ($action === 'cancel') {
                $lockedBooking->payments()
                    ->whereIn('status', [PaymentStatus::UNPAID->value, PaymentStatus::PENDING->value])
                    ->update(['status' => PaymentStatus::CANCELLED->value]);
            }

            if ($action === 'refund') {
                $lockedBooking->payments()
                    ->where('status', PaymentStatus::PAID->value)
                    ->update(['status' => PaymentStatus::REFUNDED->value]);

                $lockedBooking->payments()
                    ->whereIn('status', [PaymentStatus::UNPAID->value, PaymentStatus::PENDING->value])
                    ->update(['status' => PaymentStatus::CANCELLED->value]);
            }

            return $lockedBooking->fresh();
        });

        app(SyncAvailabilityAction::class)->executeForBooking($lockedBooking);
        app(NotifyBookingPaymentEventAction::class)->execute(
            $lockedBooking->fresh(),
            $action === 'cancel' ? 'booking_cancelled' : 'booking_refunded'
        );
    }

    private function assertBookingActionAllowed(Booking $booking, string $action): void
    {
        abort_unless(in_array($action, ['cancel', 'refund'], true), 422);

        $allowedStatuses = $action === 'cancel'
            ? self::CANCELLABLE_STATUSES
            : self::REFUNDABLE_STATUSES;

        abort_unless(in_array($this->bookingStatusValue($booking), $allowedStatuses, true), 422);
    }

    private function assertCanReviewBookingActionRequest(Company $company, BookingActionRequest $bookingActionRequest): void
    {
        abort_unless(($company->type->value ?? $company->type) === 'vendor', 404);
        abort_unless((int) $bookingActionRequest->booking?->vendor_id === (int) $company->id, 404);
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

            app(NotifyBookingPaymentEventAction::class)->execute($booking->fresh(), 'manual_payment_declined', $payment->fresh());
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
            'vendor.companySetting',
            'agent:id,name',
            'agent.companySetting',
            'user:id,name',
            'inputByUser:id,name',
            'inputByCompany:id,name,type',
            'passengers',
            'rooms',
            'addons',
            'payments',
        ]);

        $tour = $booking->tour;

        $tourPrices = collect();
        $addOns = [];

        if ($tour) {
            $schedule = TourSchedule::where('tour_code', $tour->code)
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

                $addOns = TourAddOn::where('schedule_id', $schedule->id)
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

        $minimumDownPaymentPct = $this->minimumDownPaymentPct($tour?->company?->companySetting?->minimum_down_payment);
        $paymentReceiver = app(BookingPaymentReceiverService::class)->resolveForBooking($booking);
        $paymentReceiverSettings = $paymentReceiver['settings'];
        $paidAmount = (float) $booking->payments
            ->where('status', PaymentStatus::PAID)
            ->sum('amount');
        $remainingBalance = max(0.0, (float) $booking->grand_total - $paidAmount);
        $booking->commission_amount = $this->resolveCommissionAmount($booking);
        $booking->input_by = $this->inputByPayload($booking);
        [$fullPaymentAvailable, $paymentUnavailableReason] = $this->fullPaymentAvailabilityForBooking($booking, $remainingBalance);
        $editMode = $this->resolveEditMode($booking);

        return Inertia::render($page, [
            'booking' => $booking,
            'tourPrices' => $tourPrices,
            'addOns' => $addOns,
            'minimumDownPaymentPct' => $minimumDownPaymentPct,
            'minimumVatPct' => (float) ($tour?->company?->companySetting?->minimum_vat ?? 11),
            'platformFeePerPax' => app(BookingPricingService::class)->platformFeePerPax(),
            'downPaymentAvailable' => $minimumDownPaymentPct !== null,
            'fullPaymentAvailable' => $fullPaymentAvailable,
            'paymentUnavailableReason' => $paymentUnavailableReason,
            'paidAmount' => $paidAmount,
            'remainingBalance' => $remainingBalance,
            'bookingSeatLimit' => $this->bookingSeatLimit($booking),
            'vendorBankInfo' => [
                'bankName' => $paymentReceiverSettings?->manual_bank_transfer ?? '',
                'accountName' => $paymentReceiverSettings?->manual_bank_transfer_account_name ?? '',
                'accountNumber' => $paymentReceiverSettings?->manual_bank_transfer_account_number ?? '',
            ],
            'editMode' => $editMode,
            'canEditDocuments' => $editMode === 'documents',
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
            'payment_date' => data_get($manualPayment->payload, 'payment_date'),
        ];
    }

    private function userCanAccessCompanyDashboard(mixed $user, Company $company): bool
    {
        if (! $user) {
            return false;
        }

        if (method_exists($user, 'hasRole') && $user->hasRole('user:admin')) {
            return true;
        }

        return $company->teams()
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->exists();
    }

    /**
     * @return array{user_name: string, company_name: string|null, role_label: string, created_at: string|null}
     */
    private function inputByPayload(Booking $booking): array
    {
        $role = filled($booking->input_by_role)
            ? (string) $booking->input_by_role
            : 'customer';

        $userName = $booking->inputByUser?->name
            ?? $booking->user?->name
            ?? $booking->contact_name
            ?? 'Customer';

        return [
            'user_name' => $userName,
            'company_name' => $booking->inputByCompany?->name,
            'role_label' => $this->companyRoleLabel($role),
            'created_at' => $booking->created_at?->toJSON(),
        ];
    }

    /**
     * @return list<array{type: string, label: string}>
     */
    private function invoiceOptions(Company $company, Booking $booking, ?string $paymentMode = null): array
    {
        if (! in_array($this->bookingStatusValue($booking), self::INVOICEABLE_STATUSES, true)) {
            return [];
        }

        $companyType = $company->type->value ?? $company->type;
        $paymentMode ??= app(BookingPaymentReceiverService::class)
            ->resolveForBooking($booking)['payment_mode'];
        $orderSource = $this->bookingOrderSource($booking);
        $isProforma = $this->bookingStatusValue($booking) === BookingStatus::DOWN_PAYMENT->value;
        $invoiceLabel = $isProforma ? 'Proforma Invoice' : 'Invoice';

        if ($companyType === 'vendor') {
            if ($orderSource === 'vendor' || $paymentMode === 'vendor') {
                return [[
                    'type' => 'vendor_to_customer',
                    'label' => 'View '.$invoiceLabel,
                ]];
            }

            return [[
                'type' => 'vendor_to_agent',
                'label' => 'View '.$invoiceLabel,
            ]];
        }

        if ($companyType !== 'agent' || $orderSource === 'vendor') {
            return [];
        }

        if ($paymentMode === 'vendor') {
            return [[
                'type' => 'vendor_to_customer',
                'label' => 'View '.$invoiceLabel,
            ]];
        }

        return [
            [
                'type' => 'vendor_to_agent',
                'label' => 'View Vendor '.$invoiceLabel,
            ],
            [
                'type' => 'agent_to_customer',
                'label' => 'View Customer '.$invoiceLabel,
            ],
        ];
    }

    private function bookingOrderSource(Booking $booking): string
    {
        if (
            $booking->input_by_company_id
            && (int) $booking->input_by_company_id === (int) $booking->vendor_id
        ) {
            return 'vendor';
        }

        if (
            $booking->input_by_company_id
            && $booking->agent_id
            && (int) $booking->input_by_company_id === (int) $booking->agent_id
        ) {
            return 'agent';
        }

        $role = str((string) ($booking->input_by_role ?: 'customer'))
            ->afterLast(':')
            ->lower()
            ->toString();

        return in_array($role, ['agent', 'vendor'], true) ? $role : 'customer';
    }

    /**
     * @return list<array{label: string, value: string}>
     */
    private function proformaPaymentInstructions(mixed $issuer, string $invoiceType): array
    {
        $recipient = $issuer?->name ?: 'the issuing company';
        $payer = $invoiceType === 'vendor_to_agent' ? 'Agent' : 'Customer';
        $bankAccount = $this->defaultCompanyBankAccount($issuer);
        $issuer?->loadMissing('companySetting');
        $settings = $issuer?->companySetting;
        $bankName = $bankAccount
            ? $this->bankAccountProviderName((string) $bankAccount->provider)
            : $settings?->manual_bank_transfer;
        $accountName = $bankAccount?->account_name ?: $settings?->manual_bank_transfer_account_name;
        $accountNumber = $bankAccount?->account_number ?: $settings?->manual_bank_transfer_account_number;

        return [
            [
                'label' => 'Payment Recipient',
                'value' => $recipient,
            ],
            [
                'label' => 'Bank Name',
                'value' => filled($bankName) ? (string) $bankName : '-',
            ],
            [
                'label' => 'Account Number',
                'value' => filled($accountNumber) ? (string) $accountNumber : '-',
            ],
            [
                'label' => 'Account Holder',
                'value' => filled($accountName) ? (string) $accountName : $recipient,
            ],
            [
                'label' => 'Payment Responsibility',
                'value' => $payer.' must complete the remaining balance according to the agreed payment method.',
            ],
            [
                'label' => 'Important Notice',
                'value' => 'This document is not proof of full settlement. Please retain the final invoice after the booking has been fully paid.',
            ],
        ];
    }

    private function defaultCompanyBankAccount(mixed $company): ?BankAccount
    {
        if (! $company instanceof Company) {
            return null;
        }

        return $company->bankAccounts()
            ->orderByDesc('is_default')
            ->orderByRaw("case when status = 'verified' then 1 else 0 end desc")
            ->latest()
            ->first();
    }

    private function bankAccountProviderName(string $provider): string
    {
        $providerConfig = collect(config('travelboost.bank_account_providers', []))
            ->firstWhere('code', $provider);
        $name = is_array($providerConfig) ? ($providerConfig['name'] ?? null) : null;

        return filled($name) ? (string) $name : str($provider)->upper()->toString();
    }

    private function companyRoleLabel(string $role): string
    {
        if (! array_key_exists($role, $this->roleLabelCache)) {
            $displayName = str_contains($role, ':')
                ? Role::query()->where('name', $role)->value('display_name')
                : null;

            $this->roleLabelCache[$role] = filled($displayName)
                ? (string) $displayName
                : str($role)->afterLast(':')->replace(['_', '-'], ' ')->title()->toString();
        }

        return $this->roleLabelCache[$role];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function paymentDetailPayload(Booking $booking, string $paymentType, BookingPaymentReceiverService $paymentReceiverService): ?array
    {
        $paidPayments = $booking->payments
            ->filter(fn (Payment $payment): bool => $payment->status === PaymentStatus::PAID)
            ->sortBy(fn (Payment $payment): string => (string) ($payment->paid_at ?? $payment->created_at))
            ->values();

        $payment = $paidPayments
            ->filter(fn (Payment $payment): bool => $this->bookingPaymentType($payment) === $paymentType)
            ->sortByDesc(fn (Payment $payment): string => (string) ($payment->paid_at ?? $payment->created_at))
            ->first();

        if (! $payment && $paymentType === 'full_payment') {
            $payment = $this->inferLegacyFullPaymentDetail($booking, $paidPayments);
        }

        if (! $payment) {
            return null;
        }

        $paymentReceiver = $paymentReceiverService->resolveForBooking($booking);
        $receiverType = data_get($payment->payload, 'payment_receiver_type')
            ?: $paymentReceiver['receiver_type'];

        return [
            'method_label' => $payment->provider === 'manual' ? 'Manual payment' : 'Online payment',
            'receiver_label' => $receiverType === 'agent' ? 'agent' : 'vendor',
            'amount' => (float) $payment->amount,
            'payment_date' => $this->paymentDisplayDate($payment),
            'booking_payment_type' => $this->bookingPaymentType($payment) ?? $paymentType,
            'receipt' => $this->paymentReceiptPayload($payment),
        ];
    }

    private function inferLegacyFullPaymentDetail(Booking $booking, Collection $paidPayments): ?Payment
    {
        if ($this->bookingStatusValue($booking) !== BookingStatus::FULL_PAYMENT->value) {
            return null;
        }

        $grandTotal = (float) $booking->grand_total;

        if ($grandTotal <= 0) {
            return null;
        }

        $runningPaid = 0.0;
        $inferredPayment = null;

        foreach ($paidPayments as $payment) {
            $paymentType = $this->bookingPaymentType($payment);

            if (filled($paymentType)) {
                $runningPaid += (float) $payment->amount;

                continue;
            }

            $amount = (float) $payment->amount;
            $completesGrandTotal = $runningPaid < $grandTotal
                && ($runningPaid + $amount) >= $grandTotal;

            if ($payment->provider !== 'manual' && $completesGrandTotal) {
                $inferredPayment = $payment;
            }

            $runningPaid += $amount;
        }

        return $inferredPayment;
    }

    private function bookingPaymentType(Payment $payment): ?string
    {
        $bookingPaymentType = data_get($payment->payload, 'booking_payment_type');

        if (in_array($bookingPaymentType, self::BOOKING_PAYMENT_TYPES, true)) {
            return $bookingPaymentType;
        }

        $paymentType = data_get($payment->payload, 'payment_type');

        if (in_array($paymentType, self::BOOKING_PAYMENT_TYPES, true)) {
            return $paymentType;
        }

        return null;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function paymentReceiptPayload(Payment $payment): ?array
    {
        if ($payment->provider === 'manual') {
            $proofPath = data_get($payment->payload, 'proof_path');

            return [
                'type' => 'manual',
                'url' => filled($proofPath) ? Storage::disk('public')->url((string) $proofPath) : null,
                'provider' => $payment->provider,
                'method' => $payment->payment_method,
                'order_id' => null,
                'transaction_id' => null,
                'status' => $payment->status->value,
                'raw' => null,
            ];
        }

        if ($payment->provider !== 'midtrans') {
            return null;
        }

        $midtransPayload = data_get($payment->payload, 'midtrans');
        $rawPayload = is_array($midtransPayload) ? $midtransPayload : ($payment->payload ?? []);

        return [
            'type' => 'online',
            'url' => null,
            'provider' => $payment->provider,
            'method' => (string) (data_get($rawPayload, 'payment_type') ?: $payment->payment_method),
            'order_id' => data_get($payment->payload, 'order_id') ?: data_get($rawPayload, 'order_id'),
            'transaction_id' => data_get($rawPayload, 'transaction_id'),
            'status' => data_get($rawPayload, 'transaction_status') ?: $payment->status->value,
            'raw' => $rawPayload,
        ];
    }

    private function paymentDisplayDate(Payment $payment): ?string
    {
        $payloadPaymentDate = data_get($payment->payload, 'payment_date');

        if ($payment->provider === 'manual') {
            if (filled($payloadPaymentDate)) {
                return Carbon::parse($payloadPaymentDate)->toDateString();
            }

            return ($payment->paid_at ?? $payment->created_at)?->toDateString();
        }

        if (filled($payloadPaymentDate)) {
            return Carbon::parse($payloadPaymentDate)->toJSON();
        }

        return ($payment->paid_at ?? $payment->created_at)?->toJSON();
    }

    private function manualPaymentPaidAt(Payment $payment): \DateTimeInterface
    {
        $payloadPaymentDate = data_get($payment->payload, 'payment_date');

        if (filled($payloadPaymentDate)) {
            return Carbon::parse($payloadPaymentDate)->startOfDay();
        }

        return now();
    }

    private function assertPaymentReviewable(Company $company, Booking $booking, Payment $payment): void
    {
        $this->assertCompanyCanAccessBooking($company, $booking);
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

    private function assertCompanyCanAccessBooking(Company $company, Booking $booking): void
    {
        $companyType = $company->type->value ?? $company->type;

        $belongsToCompany = $companyType === 'vendor'
            ? (int) $booking->vendor_id === (int) $company->id
            : (int) $booking->agent_id === (int) $company->id;

        abort_unless($belongsToCompany, 404);
    }

    private function canReorderBooking(Booking $booking): bool
    {
        if ($this->bookingStatusValue($booking) !== BookingStatus::EXPIRED->value) {
            return false;
        }

        if (! $booking->departure_date || ! $booking->tour) {
            return false;
        }

        $departureDate = Carbon::parse($booking->departure_date);

        if (! ($departureDate->isToday() || $departureDate->isFuture())) {
            return false;
        }

        return $this->resolveBookableSchedule($booking) !== null;
    }

    private function resolveBookableSchedule(Booking $booking): ?TourSchedule
    {
        if (! $this->isDepartureDateInsideBookingWindow($booking)) {
            return null;
        }

        return TourSchedule::query()
            ->where('tour_id', $booking->tour_id)
            ->where('company_id', $booking->vendor_id)
            ->where('is_active', true)
            ->whereDate('departure_date', Carbon::parse($booking->departure_date)->toDateString())
            ->first();
    }

    private function isDepartureDateInsideBookingWindow(Booking $booking): bool
    {
        $booking->loadMissing(['vendor.companySetting', 'tour.company.companySetting']);

        $deadlineDays = (int) (
            $booking->vendor?->companySetting?->booking_deadline
            ?? $booking->tour?->company?->companySetting?->booking_deadline
            ?? 0
        );

        return Carbon::parse($booking->departure_date)
            ->startOfDay()
            ->gte(now()->startOfDay()->addDays($deadlineDays));
    }

    private function resolveCommissionAmount(Booking $booking): float
    {
        $commissionAmount = (float) ($booking->commission_amount ?? 0);

        if ($commissionAmount > 0) {
            return $commissionAmount;
        }

        $booking->loadMissing(['tour', 'passengers']);

        $schedule = TourSchedule::query()
            ->where('tour_id', $booking->tour_id)
            ->where('company_id', $booking->vendor_id)
            ->whereDate('departure_date', $booking->departure_date)
            ->first();

        if (! $schedule || ! $booking->tour) {
            return 0;
        }

        $tourPrices = TourPrice::query()
            ->with('priceCategory')
            ->where('tour_code', $booking->tour->code)
            ->where('schedule_id', $schedule->id)
            ->get();

        if ($tourPrices->isEmpty()) {
            return 0;
        }

        if ($booking->passengers->isNotEmpty()) {
            $pricesByCategory = $tourPrices->keyBy(
                fn (TourPrice $tourPrice): string => $this->categoryKey((string) $tourPrice->priceCategory?->name)
            );

            return (float) $booking->passengers
                ->sum(function (BookingPassenger $passenger) use ($pricesByCategory): float {
                    $tourPrice = $pricesByCategory->get($this->categoryKey((string) $passenger->price_category));

                    if (! $tourPrice) {
                        return 0;
                    }

                    return $this->commissionForTourPrice($tourPrice, (float) $passenger->price_amount);
                });
        }

        $tourPrice = $tourPrices->first();
        $paxCount = (int) $booking->pax_adult + (int) $booking->pax_child;

        return $this->commissionForTourPrice($tourPrice, (float) $tourPrice->price) * $paxCount;
    }

    private function commissionForTourPrice(TourPrice $tourPrice, float $priceAmount): float
    {
        if ((float) $tourPrice->commission > 0) {
            return (float) $tourPrice->commission;
        }

        if ((float) $tourPrice->commission_rate <= 0) {
            return 0;
        }

        return (float) round($priceAmount * ((float) $tourPrice->commission_rate / 100));
    }

    private function categoryKey(string $categoryName): string
    {
        return mb_strtolower(trim($categoryName));
    }

    private function minimumDownPaymentPct(mixed $value): ?float
    {
        if (! is_numeric($value) || (float) $value <= 0) {
            return null;
        }

        return (float) $value;
    }

    private function fullPaymentAvailabilityForBooking(Booking $booking, float $incomingAmount): array
    {
        if (
            $incomingAmount <= 0
            || (float) $booking->grand_total <= 0
            || ! $booking->passengers->isNotEmpty()
        ) {
            return [true, null];
        }

        try {
            app(FinalizeBookingPaymentAction::class)
                ->assertCanFinalizeIncomingAmount($booking->fresh(), $incomingAmount);

            return [true, null];
        } catch (ValidationException) {
            return [false, 'Payment is temporarily unavailable. Please try again later or contact customer support.'];
        }
    }

    private function bookingSeatLimit(Booking $booking): int
    {
        if (! $booking->tour_id || ! $booking->departure_date || ! $booking->vendor_id) {
            return 99;
        }

        $schedule = TourSchedule::query()
            ->where('tour_id', $booking->tour_id)
            ->where('company_id', $booking->vendor_id)
            ->whereDate('departure_date', $booking->departure_date)
            ->first();

        if (! $schedule) {
            return max(0, (int) $booking->pax_adult + (int) $booking->pax_child + (int) $booking->pax_infant);
        }

        $availableSeats = (int) (TourAvailability::query()
            ->where('tour_id', $booking->tour_id)
            ->where('company_id', $booking->vendor_id)
            ->where('schedule_id', $schedule->id)
            ->value('available') ?? 0);

        return $availableSeats + $this->heldSeatCountForBooking($booking);
    }

    private function heldSeatCountForBooking(Booking $booking): int
    {
        $status = $booking->status instanceof BookingStatus
            ? $booking->status
            : BookingStatus::tryFrom((string) $booking->status);

        if (! $status?->reducesAvailability()) {
            return 0;
        }

        return max(0, (int) $booking->pax_adult + (int) $booking->pax_child + (int) $booking->pax_infant);
    }

    private function resolveEditMode(Booking $booking): string
    {
        if (in_array($booking->status, [
            BookingStatus::RESERVED,
            BookingStatus::BOOKING_RESERVED,
            BookingStatus::AWAITING_PAYMENT,
            BookingStatus::WAITING_PAYMENT_APPROVAL,
        ], true)) {
            return 'full';
        }

        if (in_array($booking->status, [
            BookingStatus::DOWN_PAYMENT,
            BookingStatus::FULL_PAYMENT,
        ], true) && $this->bookingNeedsTravelDocuments($booking)) {
            return 'documents';
        }

        return 'readonly';
    }

    private function bookingStatusValue(?Booking $booking): string
    {
        if (! $booking) {
            return '';
        }

        return $booking->status instanceof BookingStatus
            ? $booking->status->value
            : (string) $booking->status;
    }

    private function bookingNeedsTravelDocuments(Booking $booking): bool
    {
        return $this->missingDocumentPassengerCount($booking) > 0;
    }

    private function missingDocumentPassengerCount(Booking $booking): int
    {
        if ($booking->passengers->isEmpty()) {
            return 0;
        }

        return $booking->passengers
            ->filter(fn ($passenger): bool => $this->passengerNeedsTravelDocuments($passenger))
            ->count();
    }

    private function passengerNeedsTravelDocuments(mixed $passenger): bool
    {
        $category = strtolower((string) $passenger->price_category);

        if (str_contains($category, 'infant')) {
            return false;
        }

        return blank($passenger->passport_number)
            || blank($passenger->passport_issue_date)
            || blank($passenger->passport_expiry_date)
            || blank($passenger->passport_file_path)
            || blank($passenger->visa_number)
            || blank($passenger->visa_file_path);
    }

    /**
     * @return array<string, mixed>
     */
    private function paymentFollowupPayload(Company $company, Booking $booking): array
    {
        $status = $this->bookingStatusValue($booking);
        $remainingBalance = max(0.0, (float) ($booking->remaining_balance ?? 0));
        $settings = $this->vendorSettings($booking);
        $deadline = $this->deadlinePayload($booking, $settings?->full_payment_deadline);
        $basePayload = [
            'amount_due' => $remainingBalance,
            'deadline' => $deadline['date'] ?? null,
            'days_remaining' => $deadline['days_remaining'] ?? null,
            'is_overdue' => (bool) ($deadline['is_overdue'] ?? false),
            'action_url' => null,
            'action_label' => null,
        ];

        if (! in_array($status, self::FOLLOW_UP_STATUSES, true)) {
            return [
                ...$basePayload,
                'state' => 'not_applicable',
                'label' => 'Not Applicable',
            ];
        }

        if ($remainingBalance <= 0) {
            return [
                ...$basePayload,
                'state' => 'completed',
                'label' => 'Paid',
            ];
        }

        if ($status === BookingStatus::WAITING_PAYMENT_APPROVAL->value) {
            return [
                ...$basePayload,
                'state' => 'pending_approval',
                'label' => 'Waiting Approval',
            ];
        }

        return [
            ...$basePayload,
            'state' => ($basePayload['is_overdue'] ? 'overdue' : 'due'),
            'label' => ($basePayload['is_overdue'] ? 'Payment Overdue' : 'Payment Due'),
            'action_url' => $this->completePaymentUrl($company, $booking),
            'action_label' => 'Complete Payment',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function documentFollowupPayload(Company $company, Booking $booking): array
    {
        $status = $this->bookingStatusValue($booking);
        $missingCount = $this->missingDocumentPassengerCount($booking);
        $settings = $this->vendorSettings($booking);
        $deadline = $this->deadlinePayload($booking, $settings?->document_completed_deadline);
        $basePayload = [
            'missing_count' => $missingCount,
            'deadline' => $deadline['date'] ?? null,
            'days_remaining' => $deadline['days_remaining'] ?? null,
            'is_overdue' => (bool) ($deadline['is_overdue'] ?? false),
            'action_url' => null,
            'action_label' => null,
        ];

        if (! in_array($status, self::FOLLOW_UP_STATUSES, true)) {
            return [
                ...$basePayload,
                'state' => 'not_applicable',
                'label' => 'Not Applicable',
            ];
        }

        if ($missingCount <= 0) {
            return [
                ...$basePayload,
                'state' => 'completed',
                'label' => 'Completed',
            ];
        }

        return [
            ...$basePayload,
            'state' => 'incomplete',
            'label' => 'Missing Documents',
            'action_url' => route('companies.dashboard.bookings.edit', [$company, $booking], false).'?step=documents',
            'action_label' => 'Complete Documents',
        ];
    }

    /**
     * @return array<string, int>
     */
    private function emptyFollowupSummary(): array
    {
        return [
            'payment_overdue' => 0,
            'payment_due_soon' => 0,
            'documents_incomplete' => 0,
            'documents_due_soon' => 0,
        ];
    }

    /**
     * @param  array<string, int>  $summary
     * @param  array<string, mixed>  $paymentFollowup
     * @param  array<string, mixed>  $documentFollowup
     */
    private function addToFollowupSummary(array &$summary, array $paymentFollowup, array $documentFollowup): void
    {
        if (($paymentFollowup['state'] ?? null) === 'overdue') {
            $summary['payment_overdue']++;
        }

        if (
            ($paymentFollowup['state'] ?? null) === 'due'
            && $this->isDueSoon($paymentFollowup['days_remaining'] ?? null)
        ) {
            $summary['payment_due_soon']++;
        }

        if (($documentFollowup['state'] ?? null) === 'incomplete') {
            $summary['documents_incomplete']++;
        }

        if (
            ($documentFollowup['state'] ?? null) === 'incomplete'
            && $this->isDueSoon($documentFollowup['days_remaining'] ?? null)
        ) {
            $summary['documents_due_soon']++;
        }
    }

    private function isDueSoon(mixed $daysRemaining): bool
    {
        if ($daysRemaining === null) {
            return false;
        }

        $daysRemaining = (int) $daysRemaining;

        return $daysRemaining >= 0 && $daysRemaining <= self::FOLLOW_UP_DUE_SOON_DAYS;
    }

    /**
     * @return array{date: string, days_remaining: int, is_overdue: bool}|null
     */
    private function deadlinePayload(Booking $booking, mixed $daysBeforeDeparture): ?array
    {
        if (! $booking->departure_date || $daysBeforeDeparture === null) {
            return null;
        }

        $deadline = Carbon::parse($booking->departure_date)
            ->startOfDay()
            ->subDays(max(0, (int) $daysBeforeDeparture));
        $daysRemaining = (int) now()->startOfDay()->diffInDays($deadline, false);

        return [
            'date' => $deadline->toDateString(),
            'days_remaining' => $daysRemaining,
            'is_overdue' => $daysRemaining < 0,
        ];
    }

    private function completePaymentUrl(Company $company, Booking $booking): ?string
    {
        if (! $booking->tour_id || ! $booking->departure_date || blank($booking->booking_number)) {
            return null;
        }

        return route('companies.dashboard.bookings.create', [$company, $booking->tour_id], false).'?'.http_build_query([
            'date' => Carbon::parse($booking->departure_date)->toDateString(),
            'booking_number' => $booking->booking_number,
            'step' => 'payment',
        ]);
    }

    private function vendorSettings(Booking $booking): mixed
    {
        if (! $booking->vendor) {
            return null;
        }

        return $booking->vendor->companySetting
            ?? $booking->vendor->settings
            ?? $booking->vendor->settings()->first();
    }
}
