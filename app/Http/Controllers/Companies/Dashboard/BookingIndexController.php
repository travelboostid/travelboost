<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Actions\Booking\ExpireBookingReservationsAction;
use App\Actions\Booking\FinalizeBookingPaymentAction;
use App\Actions\Booking\NotifyBookingPaymentEventAction;
use App\Actions\Booking\ReactivateBookingAction;
use App\Actions\Booking\RescheduleBookingAction;
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
use App\Models\Tour;
use App\Models\TourAddOn;
use App\Models\TourAvailability;
use App\Models\TourPrice;
use App\Models\TourSchedule;
use App\Models\User;
use App\Notifications\BookingPaymentReviewStatusNotification;
use App\Services\AgentCommissionResolver;
use App\Services\BookingDownPaymentRuleService;
use App\Services\BookingPaymentReceiverService;
use App\Services\BookingPaymentWorkflowService;
use App\Services\BookingPricingService;
use App\Services\BookingService;
use App\Services\BookingTravelDocumentService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
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
    private const RESCHEDULABLE_STATUSES = [
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
    private const PAID_STATUS_RECONCILABLE_STATUSES = [
        'awaiting payment',
        'booking reserved',
        'reserved',
        'expired',
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

    /**
     * @var list<string>
     */
    private const FOLLOW_UP_FILTERS = [
        'payment_overdue',
        'payment_due_soon',
        'documents_incomplete',
        'documents_due_soon',
    ];

    public function index(Company $company, Request $request): Response|RedirectResponse
    {
        if (! $this->userCanAccessCompanyDashboard($request->user(), $company)) {
            return redirect('/');
        }

        // Reservation expiry is handled by the scheduled job (every minute) in
        // routes/console.php. Do not call it here: doing so adds DB load and
        // row-level locks to every dashboard page request.
        $paymentReceiverService = app(BookingPaymentReceiverService::class);
        $paymentWorkflowService = app(BookingPaymentWorkflowService::class);
        $pricingService = app(BookingPricingService::class);
        $travelDocumentService = app(BookingTravelDocumentService::class);
        $baseQuery = $this->bookingIndexBaseQuery($company, $request);
        $followupBookings = $this->followupBookingsForQuery(clone $baseQuery, $company);
        $followupSummary = $this->followupSummaryFromCollection($followupBookings);

        $bookingQuery = clone $baseQuery;
        if (filled($request->input('followup'))) {
            $this->applyFollowupFilterFromCollection(
                $bookingQuery,
                $followupBookings,
                (string) $request->input('followup')
            );
        } else {
            $this->applyStatusFilter($bookingQuery, $request->input('status'));
        }
        $this->applyBookingIndexSort($bookingQuery, $request);

        $bookings = $bookingQuery
            ->with($this->bookingIndexRelationships())
            ->withExists(['actionRequests as was_rescheduled' => function ($query): void {
                $query->where('target_action', 'reschedule')->where('status', 'approved');
            }])
            ->withSum(['payments as paid_amount' => function ($query): void {
                $query->where('status', 'paid');
            }], 'amount')
            ->paginate(10)
            ->withQueryString();

        $bookings->getCollection()->transform(function ($booking) use ($company, $paymentReceiverService, $paymentWorkflowService, $pricingService, $travelDocumentService) {
            $booking = $pricingService->reconcileSnapshotTotals($booking);
            $booking = $this->reconcilePaidBookingStatusIfStale($booking);
            $booking->commission_amount = $this->resolveCommissionAmount($booking);

            $this->attachFollowupPayloads($company, $booking);
            $booking->input_by = $this->inputByPayload($booking);
            $booking->down_payment_detail = $this->paymentDetailPayload($booking, 'down_payment', $paymentReceiverService);
            $booking->full_payment_detail = $this->paymentDetailPayload($booking, 'full_payment', $paymentReceiverService);
            $booking->remaining_balance_visible = $this->bookingStatusValue($booking) === BookingStatus::DOWN_PAYMENT->value;
            $booking->continue_booking_url = $this->continueBookingUrl($company, $booking);
            $booking->document_detail = $travelDocumentService->documentDetails($booking);
            $booking->payment_workflow = $paymentWorkflowService->workflowPayload($company, $booking);
            $reviewablePayment = $paymentWorkflowService->reviewablePaymentForCompany($company, $booking);
            $booking->manual_payment = $reviewablePayment
                ? $this->paymentReviewPayload($booking, $reviewablePayment)
                : null;
            $booking->can_review_payment = $reviewablePayment !== null;
            $booking->can_review_manual_payment = $reviewablePayment !== null;
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
            $booking->can_reschedule = app(RescheduleBookingAction::class)->canReschedule($booking);
            $booking->can_reactivate = app(ReactivateBookingAction::class)->canReactivate($booking);
            $booking->can_reorder = $this->canReorderBooking($booking);
            $booking->proforma_invoice_available = $this->proformaInvoiceAvailable($booking);
            $booking->was_rescheduled = (bool) ($booking->was_rescheduled ?? false);

            return $booking;
        });

        return Inertia::render('companies/dashboard/bookings/index', [
            'data' => $bookings,
            'followupSummary' => $followupSummary,
        ]);
    }

    private function bookingIndexBaseQuery(Company $company, Request $request): Builder
    {
        return Booking::query()
            ->when(($company->type->value ?? $company->type) === 'vendor', function (Builder $query) use ($company): void {
                $query->where('vendor_id', $company->id);
            })
            ->when(($company->type->value ?? $company->type) === 'agent', function (Builder $query) use ($company): void {
                $query->where('agent_id', $company->id);
            })
            ->when($request->input('booking_number'), function (Builder $query, string $search): void {
                $query->where('booking_number', 'ilike', "{$search}%");
            })
            ->when($request->input('contact_name'), function (Builder $query, string $search): void {
                $query->where('contact_name', 'ilike', "{$search}%");
            });
    }

    private function applyStatusFilter(Builder $query, mixed $status): void
    {
        if (blank($status)) {
            return;
        }

        if (in_array($status, ['reserved', 'booking reserved'], true)) {
            $query->whereIn('status', ['reserved', 'booking reserved']);

            return;
        }

        $query->where('status', $status);
    }

    private function applyBookingIndexSort(Builder $query, Request $request): void
    {
        if (filled($request->input('sort'))) {
            $sorts = explode(',', (string) $request->input('sort'));
            foreach ($sorts as $sort) {
                if (str_starts_with($sort, '-')) {
                    $query->orderBy(substr($sort, 1), 'desc');
                } else {
                    $query->orderBy($sort, 'asc');
                }
            }

            return;
        }

        $query->latest();
    }

    /**
     * @return array<int|string, mixed>
     */
    private function bookingIndexRelationships(): array
    {
        return [
            'tour:id,name,code',
            'vendor:id,name',
            'vendor.companySetting',
            'agent:id,name',
            'agent.companySetting',
            'user:id,name',
            'inputByUser:id,name',
            'inputByCompany:id,name,type',
            'passengers:id,booking_id,title,first_name,last_name,price_category,price_amount,passport_number,passport_issue_date,passport_expiry_date,passport_file_path,visa_number,visa_file_path,visa_category_item_id,visa_type_description,visa_type_price,visa_type_is_taxable',
            'payments',
            'actionRequests' => fn ($query) => $query->where('status', 'pending')->latest(),
        ];
    }

    /**
     * @return Collection<int, Booking>
     */
    private function followupBookingsForQuery(Builder $query, Company $company): Collection
    {
        return $query
            ->whereIn('status', self::FOLLOW_UP_STATUSES)
            ->with($this->bookingIndexRelationships())
            ->withSum(['payments as paid_amount' => function ($query): void {
                $query->where('status', 'paid');
            }], 'amount')
            ->limit(500)
            ->get()
            ->map(function (Booking $booking) use ($company): Booking {
                $booking = app(BookingPricingService::class)->reconcileSnapshotTotals($booking);
                $this->attachFollowupPayloads($company, $booking);

                return $booking;
            });
    }

    /**
     * @param  Collection<int, Booking>  $bookings
     * @return array<string, int|float>
     */
    private function followupSummaryFromCollection(Collection $bookings): array
    {
        $summary = $this->emptyFollowupSummary();

        $bookings->each(function (Booking $booking) use (&$summary): void {
            $this->addToFollowupSummary(
                $summary,
                $booking->payment_followup,
                $booking->document_followup
            );
        });

        return $summary;
    }

    /**
     * @param  Collection<int, Booking>  $followupBookings
     */
    private function applyFollowupFilterFromCollection(
        Builder $query,
        Collection $followupBookings,
        string $followup
    ): void {
        if (! in_array($followup, self::FOLLOW_UP_FILTERS, true)) {
            return;
        }

        $matchingIds = $followupBookings
            ->filter(fn (Booking $booking): bool => $this->matchesFollowupFilter(
                $booking->payment_followup,
                $booking->document_followup,
                $followup
            ))
            ->pluck('id')
            ->map(fn (mixed $id): int => (int) $id)
            ->values()
            ->all();

        if ($matchingIds === []) {
            $query->whereRaw('1 = 0');

            return;
        }

        $query->whereIn('id', $matchingIds);
    }

    private function attachFollowupPayloads(Company $company, Booking $booking): void
    {
        $paidAmount = app(BookingPaymentWorkflowService::class)->finalizablePaidAmount($booking);
        $booking->paid_amount = $paidAmount;
        $effectiveGrandTotal = $this->effectiveGrandTotalForPayment($booking, $paidAmount);
        $booking->remaining_balance = max(0, $effectiveGrandTotal - $paidAmount);
        $booking->payment_followup = $this->paymentFollowupPayload($company, $booking, $effectiveGrandTotal);
        $booking->document_followup = $this->documentFollowupPayload($company, $booking);
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
        $isRequestedProforma = $this->canRenderDashboardProformaInvoice($booking, $request);

        abort_unless(in_array($companyType, ['agent', 'vendor'], true), 404);
        abort_unless(
            ($companyType === 'agent' && (int) $booking->agent_id === (int) $company->id)
            || ($companyType === 'vendor' && (int) $booking->vendor_id === (int) $company->id),
            404
        );
        abort_unless(
            $isRequestedProforma
            || in_array($this->bookingStatusValue($booking), self::INVOICEABLE_STATUSES, true),
            404
        );

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
        $booking = app(BookingPricingService::class)->reconcileSnapshotTotals($booking);

        $paidPayments = $booking->payments
            ->filter(fn (Payment $payment): bool => $payment->status === PaymentStatus::PAID)
            ->sortBy(fn (Payment $payment): string => (string) ($payment->paid_at ?? $payment->created_at))
            ->values();

        abort_if($paidPayments->isEmpty() && ! $isRequestedProforma, 404);

        $paymentDate = $paidPayments->last()?->paid_at ?? $paidPayments->last()?->created_at;
        $invoiceSchedule = $this->resolveInvoiceSchedule($booking);
        $priceBreakdown = $this->buildInvoicePriceBreakdown($booking, $invoiceSchedule);
        $taxableAddonRows = $booking->addons
            ->filter(fn ($addon): bool => (bool) $addon->is_taxable)
            ->values();
        $nonTaxableAddonRows = $booking->addons
            ->filter(fn ($addon): bool => ! $addon->is_taxable)
            ->values();
        $paymentDetails = $this->buildInvoicePaymentDetails($booking, $taxableAddonRows, $invoiceSchedule);
        $paymentDetailsTotal = (float) collect($paymentDetails)->sum('amount');
        $vatAmount = (float) $booking->tax_amount;
        $paymentReceiver = app(BookingPaymentReceiverService::class)->resolveForBooking($booking);
        $invoiceOptions = $this->invoiceOptions(
            $company,
            $booking,
            $paymentReceiver['payment_mode'],
            $isRequestedProforma
        );
        $requestedInvoiceType = $request->string('type')->toString();
        $invoiceType = collect($invoiceOptions)
            ->pluck('type')
            ->first(fn (string $type): bool => $type === $requestedInvoiceType)
            ?? data_get($invoiceOptions, '0.type');

        abort_unless($invoiceType, 404);

        $isVendorToAgentInvoice = $invoiceType === 'vendor_to_agent';
        $isAgentToCustomerInvoice = $invoiceType === 'agent_to_customer';
        $isCustomerInvoice = ! $isVendorToAgentInvoice;
        $isProforma = $isRequestedProforma
            || $this->bookingStatusValue($booking) === BookingStatus::DOWN_PAYMENT->value;
        $paidAmount = (float) $paidPayments->sum('amount');
        $invoiceGrandTotal = $isVendorToAgentInvoice
            ? $paymentDetailsTotal + $vatAmount
            : (float) $booking->grand_total;
        $invoiceNumber = $isVendorToAgentInvoice
            ? 'V2A-'.str_pad((string) $booking->vendor_id, 4, '0', STR_PAD_LEFT).'-'.$booking->booking_number
            : $booking->booking_number;
        $issuer = $isAgentToCustomerInvoice
            ? $booking->agent
            : ($booking->vendor ?? $booking->tour?->company);
        $billedTo = $isVendorToAgentInvoice ? ($booking->agent ?? $company) : null;
        $customerName = $booking->contact_name ?: $booking->user?->name;
        $customerEmail = $booking->contact_email ?: $booking->user?->email;
        $customerPhone = $booking->contact_phone ?: $booking->user?->phone;
        $vatRate = $this->resolveInvoiceVatRate($booking);
        $deadline = $this->deadlinePayload($booking, $this->vendorSettings($booking)?->full_payment_deadline);
        $filename = ($isProforma ? 'Proforma_Invoice_' : 'Invoice_').$invoiceNumber.'.pdf';

        $pdf = Pdf::setOption(['isRemoteEnabled' => true])
            ->loadView('exports.booking-invoice', [
                'booking' => $booking,
                'agent' => $issuer,
                'logoSrc' => $this->resolveCompanyLogoSrc($issuer),
                'customerName' => $billedTo?->name ?? $customerName,
                'billedToName' => $billedTo?->name ?? $customerName,
                'billedToEmail' => $billedTo?->email ?? $customerEmail,
                'billedToPhone' => ($billedTo?->customer_service_phone ?: $billedTo?->phone) ?? $customerPhone,
                'billedToAddress' => $isVendorToAgentInvoice ? $billedTo?->address : null,
                'paymentDate' => $paymentDate,
                'invoiceDate' => $booking->created_at,
                'dueDate' => $deadline['date'] ?? null,
                'returnDate' => $invoiceSchedule?->return_date,
                'paidAmount' => $paidAmount,
                'invoicePaidAmount' => $isVendorToAgentInvoice && ! $isProforma
                    ? $invoiceGrandTotal
                    : $paidAmount,
                'priceBreakdown' => $priceBreakdown,
                'paymentDetails' => $paymentDetails,
                'paymentDetailsTotal' => $paymentDetailsTotal,
                'vatRate' => $vatRate,
                'platformFeeAmount' => $isCustomerInvoice ? (float) $booking->platform_fee : 0,
                'nonTaxableAddonSummaryRows' => $nonTaxableAddonRows
                    ->map(fn ($addon): array => [
                        'label' => $addon->name ?: 'Add-on',
                        'amount' => (float) $addon->price,
                    ])
                    ->concat($this->nonTaxableVisaSummaryRows($booking))
                    ->values()
                    ->all(),
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

    public function invoicePreview(Company $company, Booking $booking, Request $request): HttpResponse
    {
        $this->assertCompanyCanAccessBooking($company, $booking);

        $validated = $request->validate([
            'type' => ['nullable', 'string'],
            'preview_status' => ['nullable', 'string'],
            'tax_amount' => ['required', 'numeric', 'min:0'],
            'grand_total' => ['required', 'numeric', 'min:0'],
            'platform_fee' => ['nullable', 'numeric', 'min:0'],
            'addons' => ['array'],
            'addons.*.name' => ['required', 'string'],
            'addons.*.price' => ['required', 'numeric', 'min:0'],
            'addons.*.qty' => ['nullable', 'integer', 'min:1'],
            'addons.*.is_taxable' => ['nullable', 'boolean'],
            'visa_items' => ['array'],
            'visa_items.*.description' => ['required', 'string'],
            'visa_items.*.price' => ['required', 'numeric', 'min:0'],
            'visa_items.*.qty' => ['nullable', 'integer', 'min:1'],
        ]);

        $booking->load([
            'user',
            'agent.photo',
            'agent.companySetting',
            'vendor.photo',
            'vendor.companySetting',
            'tour.company.companySetting',
            'passengers',
            'payments',
        ]);
        $booking = app(BookingPricingService::class)->reconcileSnapshotTotals($booking);

        $paymentReceiver = app(BookingPaymentReceiverService::class)->resolveForBooking($booking);
        $invoiceOptions = $this->invoiceOptions($company, $booking, $paymentReceiver['payment_mode'], true);
        $requestedInvoiceType = (string) ($validated['type'] ?? '');
        $preferredCustomerFacingInvoiceType = collect($invoiceOptions)
            ->pluck('type')
            ->first(fn (string $type): bool => in_array($type, ['agent_to_customer', 'vendor_to_customer'], true));
        $invoiceType = collect($invoiceOptions)
            ->pluck('type')
            ->first(fn (string $type): bool => $type === $requestedInvoiceType)
            ?? $preferredCustomerFacingInvoiceType
            ?? data_get($invoiceOptions, '0.type');

        abort_unless($invoiceType, 404);

        $temporaryAddons = collect($validated['addons'] ?? [])
            ->filter(fn (array $addon): bool => (float) $addon['price'] * (int) ($addon['qty'] ?? 1) > 0)
            ->map(fn (array $addon): object => (object) [
                'name' => $addon['name'],
                'price' => (float) $addon['price'],
                'qty' => (int) ($addon['qty'] ?? 1),
                'is_taxable' => (bool) ($addon['is_taxable'] ?? false),
            ])
            ->values();

        $taxableAddonRows = $temporaryAddons
            ->filter(fn (object $addon): bool => (bool) $addon->is_taxable)
            ->values();
        $nonTaxableAddonRows = $temporaryAddons
            ->filter(fn (object $addon): bool => ! $addon->is_taxable)
            ->values();
        $nonTaxableVisaRows = collect($validated['visa_items'] ?? [])
            ->filter(fn (array $visaItem): bool => (float) $visaItem['price'] * (int) ($visaItem['qty'] ?? 1) >= 0)
            ->map(fn (array $visaItem): array => [
                'label' => 'Visa: '.$visaItem['description'].' (x'.(int) ($visaItem['qty'] ?? 1).')',
                'amount' => (float) $visaItem['price'] * (int) ($visaItem['qty'] ?? 1),
            ])
            ->values();
        $invoiceSchedule = $this->resolveInvoiceSchedule($booking);
        $paymentDetails = $this->buildInvoicePaymentDetails($booking, $taxableAddonRows, $invoiceSchedule);
        $paymentDetailsTotal = (float) collect($paymentDetails)->sum('amount');
        $priceBreakdown = $this->buildInvoicePriceBreakdown($booking, $invoiceSchedule);
        $customerName = $booking->contact_name ?: $booking->user?->name;
        $customerEmail = $booking->contact_email ?: $booking->user?->email;
        $customerPhone = $booking->contact_phone ?: $booking->user?->phone;
        $issuer = $invoiceType === 'agent_to_customer'
            ? $booking->agent
            : ($booking->vendor ?? $booking->tour?->company);
        $vatRate = $this->resolveInvoiceVatRate($booking);
        $deadline = $this->deadlinePayload($booking, $this->vendorSettings($booking)?->full_payment_deadline);
        $invoiceNumber = $booking->booking_number;

        $pdf = Pdf::setOption(['isRemoteEnabled' => true])
            ->loadView('exports.booking-invoice', [
                'booking' => $booking,
                'agent' => $issuer,
                'logoSrc' => $this->resolveCompanyLogoSrc($issuer),
                'customerName' => $customerName,
                'billedToName' => $customerName,
                'billedToEmail' => $customerEmail,
                'billedToPhone' => $customerPhone,
                'billedToAddress' => null,
                'paymentDate' => null,
                'invoiceDate' => $booking->created_at,
                'dueDate' => $deadline['date'] ?? null,
                'returnDate' => $invoiceSchedule?->return_date,
                'paidAmount' => 0,
                'invoicePaidAmount' => 0,
                'priceBreakdown' => $priceBreakdown,
                'paymentDetails' => $paymentDetails,
                'paymentDetailsTotal' => $paymentDetailsTotal,
                'invoiceTaxAmount' => (float) $validated['tax_amount'],
                'vatRate' => $vatRate,
                'platformFeeAmount' => (float) ($validated['platform_fee'] ?? $booking->platform_fee ?? 0),
                'nonTaxableAddonSummaryRows' => $nonTaxableAddonRows
                    ->map(fn (object $addon): array => [
                        'label' => ($addon->name ?: 'Add-on').' (x'.(int) $addon->qty.')',
                        'amount' => (float) $addon->price * (int) $addon->qty,
                    ])
                    ->concat($nonTaxableVisaRows)
                    ->values()
                    ->all(),
                'invoiceGrandTotal' => (float) $validated['grand_total'],
                'invoiceNumber' => $invoiceNumber,
                'isProforma' => true,
                'invoiceStatusLabel' => $request->string('preview_status')->toString() === 'unpaid'
                    ? 'Unpaid'
                    : 'Down Payment',
                'paymentInstructions' => $this->proformaPaymentInstructions($issuer, $invoiceType),
            ])
            ->setPaper('A4', 'portrait');

        return $pdf->stream('Proforma_Invoice_'.$invoiceNumber.'.pdf');
    }

    public function update(Company $company, Booking $booking, UpdateBookingRequest $request): RedirectResponse
    {
        $this->assertCompanyCanAccessBooking($company, $booking);
        abort_unless($this->resolveEditMode($booking->loadMissing('passengers')) === 'full', 403);

        app(BookingService::class)->updateBookingSnapshot($booking, $request->validated());

        return back()->with('success', 'Booking updated successfully.');
    }

    public function acceptManualPayment(Company $company, Booking $booking, Payment $payment): RedirectResponse
    {
        $this->assertPaymentReviewable($company, $booking, $payment);

        DB::transaction(function () use ($booking, $payment): void {
            $paymentWorkflow = app(BookingPaymentWorkflowService::class);

            if ($paymentWorkflow->isCustomerToAgentPayment($payment)) {
                $payment->update([
                    'status' => PaymentStatus::PAID,
                    'paid_at' => $this->manualPaymentPaidAt($payment),
                ]);
                $paymentWorkflow->approveCustomerPaymentByAgent($payment->fresh(), request()->user());

                $booking->update([
                    'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
                    'payment_mode' => 'manual',
                    'reserved_expires_at' => null,
                ]);

                app(NotifyBookingPaymentEventAction::class)->execute($booking->fresh(), 'manual_payment_accepted', $payment->fresh());

                return;
            }

            if ($paymentWorkflow->isAgentToVendorPayment($payment)) {
                $customerPayment = $paymentWorkflow->customerPaymentForAgentVendorPayment($booking->loadMissing('payments'), $payment);
                abort_unless($customerPayment instanceof Payment, 422);

                if ($payment->status === PaymentStatus::PENDING) {
                    $payment->update([
                        'status' => PaymentStatus::PAID,
                        'paid_at' => $this->manualPaymentPaidAt($payment),
                    ]);
                }

                $paymentWorkflow->approveAgentVendorPaymentByVendor($payment->fresh(), $customerPayment->fresh(), request()->user());

                $booking->update([
                    'payment_mode' => $payment->provider === 'midtrans' ? 'online' : 'manual',
                ]);

                app(FinalizeBookingPaymentAction::class)->execute($booking->fresh(), $customerPayment->fresh());
                app(NotifyBookingPaymentEventAction::class)->execute($booking->fresh(), 'manual_payment_accepted', $payment->fresh());

                return;
            }

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

        $this->sendBookingContactPaymentReviewEmail($company, $booking->fresh(['tour', 'user']), $payment->fresh(), 'accepted');

        return back()->with('success', 'Payment accepted.');
    }

    public function cancel(Company $company, Booking $booking, Request $request): RedirectResponse
    {
        return $this->handleBookingAction($company, $booking, 'cancel', $request);
    }

    public function refund(Company $company, Booking $booking, Request $request): RedirectResponse
    {
        return $this->handleBookingAction($company, $booking, 'refund', $request);
    }

    public function rescheduleOptions(Company $company, Booking $booking): JsonResponse
    {
        $this->assertCompanyCanAccessBooking($company, $booking);
        abort_unless(app(RescheduleBookingAction::class)->canReschedule($booking), 422);

        $booking->loadMissing(['vendor.companySetting', 'tour.company.companySetting']);
        $requiredSeats = (int) ($booking->pax_adult ?? 0) + (int) ($booking->pax_child ?? 0);
        $currentDeparture = Carbon::parse($booking->departure_date)->toDateString();
        $rescheduleAction = app(RescheduleBookingAction::class);

        $deadlineDays = (int) (
            $booking->vendor?->companySetting?->booking_deadline
            ?? $booking->tour?->company?->companySetting?->booking_deadline
            ?? 0
        );
        $earliestBookableDate = now()->startOfDay()->addDays($deadlineDays);

        $schedules = TourSchedule::query()
            ->with(['availability', 'prices'])
            ->where('tour_id', $booking->tour_id)
            ->where('company_id', $booking->vendor_id)
            ->where('is_active', true)
            ->whereDate('departure_date', '>=', $earliestBookableDate->toDateString())
            ->orderBy('departure_date')
            ->get()
            ->filter(function (TourSchedule $schedule) use ($booking, $requiredSeats, $currentDeparture, $rescheduleAction): bool {
                if (Carbon::parse($schedule->departure_date)->toDateString() === $currentDeparture) {
                    return false;
                }

                $availability = $schedule->availability;

                if (! $availability || (int) $availability->available < $requiredSeats) {
                    return false;
                }

                return $rescheduleAction->canReschedule($booking);
            })
            ->values()
            ->map(function (TourSchedule $schedule) use ($booking, $rescheduleAction): array {
                $departureDate = Carbon::parse($schedule->departure_date)->toDateString();
                $prices = $schedule->prices ?? collect();
                $priceFrom = $prices->isNotEmpty()
                    ? (float) $prices->min('price')
                    : 0.0;
                $pricePreview = $rescheduleAction->previewPricingChange($booking, $schedule);

                return [
                    'id' => $schedule->id,
                    'departure_date' => $departureDate,
                    'return_date' => $schedule->return_date
                        ? Carbon::parse($schedule->return_date)->toDateString()
                        : null,
                    'available' => (int) ($schedule->availability?->available ?? 0),
                    'price_from' => $priceFrom,
                    'is_current' => false,
                    'price_preview' => $pricePreview,
                ];
            });

        return response()->json([
            'current_departure_date' => $currentDeparture,
            'required_seats' => $requiredSeats,
            'schedules' => $schedules,
        ]);
    }

    public function reschedule(Company $company, Booking $booking, Request $request): RedirectResponse
    {
        $this->assertCompanyCanAccessBooking($company, $booking);
        $this->assertNoPendingBookingActionRequest($booking);

        $validated = $request->validate([
            'schedule_id' => ['required', 'integer', 'exists:tour_schedules,id'],
            'reason' => ['nullable', 'string', 'max:1000'],
            'apply_customer_price_adjustment' => ['sometimes', 'boolean'],
        ]);

        $schedule = TourSchedule::query()
            ->whereKey($validated['schedule_id'])
            ->where('tour_id', $booking->tour_id)
            ->where('company_id', $booking->vendor_id)
            ->firstOrFail();

        $applyCustomerPriceAdjustment = $this->resolveApplyCustomerPriceAdjustment(
            $company,
            $request->boolean('apply_customer_price_adjustment', true),
        );

        $payload = $this->buildReschedulePayload($booking, $schedule, $applyCustomerPriceAdjustment);

        return $this->handleModificationAction(
            $company,
            $booking,
            'reschedule',
            $request,
            $payload,
            fn (Booking $lockedBooking) => app(RescheduleBookingAction::class)->execute(
                $lockedBooking,
                $schedule,
                $applyCustomerPriceAdjustment,
            ),
            'booking_rescheduled'
        );
    }

    public function restore(Company $company, Booking $booking, Request $request): RedirectResponse
    {
        $this->assertCompanyCanAccessBooking($company, $booking);
        $this->assertNoPendingBookingActionRequest($booking);

        $reactivateAction = app(ReactivateBookingAction::class);
        abort_unless($reactivateAction->canReactivate($booking), 422);

        $payload = [
            'previous_status' => $this->bookingStatusValue($booking),
            'restored_status' => $reactivateAction->resolveTargetStatus($booking)->value,
            'departure_date' => Carbon::parse($booking->departure_date)->toDateString(),
        ];

        return $this->handleModificationAction(
            $company,
            $booking,
            'restore',
            $request,
            $payload,
            fn (Booking $lockedBooking) => $reactivateAction->execute($lockedBooking),
            'booking_reactivated'
        );
    }

    public function actionRequests(Company $company, Request $request): Response
    {
        $companyType = $company->type->value ?? $company->type;
        abort_unless(in_array($companyType, ['agent', 'vendor'], true), 404);

        $allowedActions = ['cancel', 'refund', 'reschedule', 'restore'];
        $requestedAction = $request->query('action');
        $activeAction = is_string($requestedAction) && in_array($requestedAction, $allowedActions, true)
            ? $requestedAction
            : 'cancel';
        $search = $request->string('search')->trim()->limit(100, '')->toString();

        $requests = BookingActionRequest::query()
            ->with([
                'booking:id,booking_number,contact_name,status,tour_id,vendor_id,agent_id,grand_total,departure_date',
                'booking.tour:id,name,code',
                'requesterCompany:id,name,username,type',
                'requesterUser:id,name,email',
                'reviewerCompany:id,name,username,type',
                'reviewerUser:id,name,email',
                'reviewerUser.roles:id,name,display_name',
            ])
            ->when($companyType === 'vendor', fn ($query) => $query->whereHas('booking', fn ($bookingQuery) => $bookingQuery->where('vendor_id', $company->id)))
            ->when($companyType === 'agent', fn ($query) => $query->where('requester_company_id', $company->id))
            ->where('target_action', $activeAction)
            ->when($search !== '', fn (Builder $query) => $this->applyBookingActionRequestSearch($query, $search))
            ->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END")
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (BookingActionRequest $actionRequest): array => [
                'id' => $actionRequest->id,
                'target_action' => $actionRequest->target_action,
                'status' => $actionRequest->status,
                'reason' => $actionRequest->reason,
                'payload' => $actionRequest->payload,
                'created_at' => $actionRequest->created_at?->toIso8601String(),
                'booking' => [
                    'id' => $actionRequest->booking?->id,
                    'booking_number' => $actionRequest->booking?->booking_number,
                    'contact_name' => $actionRequest->booking?->contact_name,
                    'status' => $this->bookingStatusValue($actionRequest->booking),
                    'grand_total' => $actionRequest->booking?->grand_total,
                    'departure_date' => $actionRequest->booking?->departure_date?->toDateString(),
                    'tour' => $actionRequest->booking?->tour
                        ? [
                            'id' => $actionRequest->booking->tour->id,
                            'name' => $actionRequest->booking->tour->name,
                            'code' => $actionRequest->booking->tour->code,
                        ]
                        : null,
                ],
                'requester_company' => $actionRequest->requesterCompany
                    ? [
                        'id' => $actionRequest->requesterCompany->id,
                        'name' => $actionRequest->requesterCompany->name,
                        'username' => $actionRequest->requesterCompany->username,
                    ]
                    : null,
                'requester_user' => $actionRequest->requesterUser
                    ? [
                        'id' => $actionRequest->requesterUser->id,
                        'name' => $actionRequest->requesterUser->name,
                        'email' => $actionRequest->requesterUser->email,
                    ]
                    : null,
                'reviewer' => $this->bookingActionRequestReviewerPayload($actionRequest),
            ]);

        return Inertia::render('companies/dashboard/bookings/action-requests', [
            'requests' => $requests,
            'activeAction' => $activeAction,
            'search' => $search,
            'canReviewRequests' => $companyType === 'vendor',
            'actionRequiredCounts' => $this->bookingModificationActionRequiredCounts($company),
        ]);
    }

    private function applyBookingActionRequestSearch(Builder $query, string $search): void
    {
        $likeSearch = "%{$search}%";
        $normalizedSearch = '%'.str($search)->lower()->toString().'%';

        $query->where(function (Builder $query) use ($likeSearch, $normalizedSearch): void {
            $query
                ->whereRaw($this->textSearchSql('booking_action_requests.id'), [$normalizedSearch])
                ->orWhereLike('booking_action_requests.target_action', $likeSearch)
                ->orWhereLike('booking_action_requests.status', $likeSearch)
                ->orWhereLike('booking_action_requests.reason', $likeSearch)
                ->orWhereHas('booking', function (Builder $bookingQuery) use ($likeSearch, $normalizedSearch): void {
                    $bookingQuery
                        ->whereRaw($this->textSearchSql('bookings.id'), [$normalizedSearch])
                        ->orWhereLike('bookings.booking_number', $likeSearch)
                        ->orWhereLike('bookings.contact_name', $likeSearch)
                        ->orWhereLike('bookings.status', $likeSearch)
                        ->orWhereRaw($this->textSearchSql('bookings.departure_date'), [$normalizedSearch])
                        ->orWhereRaw($this->textSearchSql('bookings.grand_total'), [$normalizedSearch])
                        ->orWhereHas('tour', function (Builder $tourQuery) use ($likeSearch): void {
                            $tourQuery
                                ->whereLike('name', $likeSearch)
                                ->orWhereLike('code', $likeSearch)
                                ->orWhereLike('destination', $likeSearch);
                        });
                })
                ->orWhereHas('requesterCompany', function (Builder $companyQuery) use ($likeSearch): void {
                    $companyQuery
                        ->whereLike('name', $likeSearch)
                        ->orWhereLike('username', $likeSearch);
                })
                ->orWhereHas('requesterUser', function (Builder $userQuery) use ($likeSearch): void {
                    $userQuery
                        ->whereLike('name', $likeSearch)
                        ->orWhereLike('email', $likeSearch);
                });
        });
    }

    private function textSearchSql(string $column): string
    {
        $castType = match (DB::connection()->getDriverName()) {
            'mysql', 'mariadb' => 'CHAR',
            default => 'TEXT',
        };

        return "LOWER(CAST({$column} AS {$castType})) LIKE ?";
    }

    /**
     * @return array{cancellations: int, refunds: int, reschedules: int, restores: int, total: int}
     */
    private function bookingModificationActionRequiredCounts(Company $company): array
    {
        $emptyCounts = [
            'cancellations' => 0,
            'refunds' => 0,
            'reschedules' => 0,
            'restores' => 0,
            'total' => 0,
        ];

        if (($company->type->value ?? $company->type) !== 'vendor') {
            return $emptyCounts;
        }

        $countsByAction = BookingActionRequest::query()
            ->select('target_action', DB::raw('count(*) as aggregate'))
            ->where('status', 'pending')
            ->whereHas('booking', fn ($query) => $query->where('vendor_id', $company->id))
            ->groupBy('target_action')
            ->pluck('aggregate', 'target_action');

        $counts = [
            'cancellations' => (int) ($countsByAction['cancel'] ?? 0),
            'refunds' => (int) ($countsByAction['refund'] ?? 0),
            'reschedules' => (int) ($countsByAction['reschedule'] ?? 0),
            'restores' => (int) ($countsByAction['restore'] ?? 0),
        ];

        return [
            ...$counts,
            'total' => array_sum($counts),
        ];
    }

    /**
     * @return array{user_name: string, company_name: string|null, role_label: string, action_label: string, reviewed_at: string|null}|null
     */
    private function bookingActionRequestReviewerPayload(BookingActionRequest $request): ?array
    {
        // System-generated action requests (e.g. auto-cancelled overdue down
        // payment bookings) have no human reviewer. Surface them with a
        // `System` marker so the booking-correction list can still render
        // the actor and action label.
        $isSystemAction = $request->status === 'approved'
            && $request->reviewerUser === null
            && $request->reviewerCompany === null;

        if (! $request->reviewerUser && ! $request->reviewerCompany && ! $isSystemAction) {
            return null;
        }

        return [
            'user_name' => $request->reviewerUser?->name ?? 'System',
            'company_name' => $request->reviewerCompany?->name,
            'role_label' => $isSystemAction
                ? 'System'
                : $this->bookingActionRequestReviewerRoleLabel($request->reviewerCompany, $request->reviewerUser),
            'action_label' => $this->bookingActionRequestReviewerActionLabel($request),
            'reviewed_at' => $request->reviewed_at?->toIso8601String(),
        ];
    }

    private function bookingActionRequestReviewerActionLabel(BookingActionRequest $request): string
    {
        if ($request->status === 'rejected') {
            return 'Rejected by';
        }

        if ($request->status !== 'approved') {
            return 'Reviewed by';
        }

        // System actions have no human reviewer; the booking-correction
        // list should explicitly say `Cancelled by system` etc.
        if ($request->reviewerUser === null && $request->reviewerCompany === null) {
            return match ($request->target_action) {
                'cancel' => 'Cancelled by system',
                'refund' => 'Refunded by system',
                'reschedule' => 'Rescheduled by system',
                'restore' => 'Reactivated by system',
                default => 'Actioned by system',
            };
        }

        if ((int) $request->requester_company_id !== (int) $request->reviewer_company_id) {
            return 'Approved by';
        }

        return match ($request->target_action) {
            'cancel' => 'Cancelled by',
            'refund' => 'Refunded by',
            'reschedule' => 'Rescheduled by',
            'restore' => 'Reactivated by',
            default => 'Approved by',
        };
    }

    private function bookingActionRequestReviewerRoleLabel(?Company $company, ?User $user): string
    {
        if ($user) {
            $user->loadMissing('roles');

            $adminRole = $user->roles
                ->first(fn (Role $role): bool => in_array($role->name, ['admin:superadmin', 'user:admin'], true));

            if ($adminRole) {
                return $this->companyRoleLabel($adminRole->name);
            }

            if ($company) {
                $companyRolePrefix = "company:{$company->id}:";
                $companyRole = $user->roles
                    ->first(fn (Role $role): bool => str_starts_with($role->name, $companyRolePrefix));

                if ($companyRole) {
                    return $this->companyRoleLabel($companyRole->name);
                }
            }
        }

        if ($company) {
            return str((string) ($company->type->value ?? $company->type))
                ->title()
                ->toString();
        }

        return 'Reviewer';
    }

    public function approveActionRequest(Company $company, BookingActionRequest $bookingActionRequest, Request $request): RedirectResponse
    {
        $bookingActionRequest->loadMissing('booking');
        $this->assertCanReviewBookingActionRequest($company, $bookingActionRequest);
        abort_unless($bookingActionRequest->status === 'pending', 422);

        if (in_array($bookingActionRequest->target_action, ['reschedule', 'restore'], true)) {
            $applyCustomerPriceAdjustment = $bookingActionRequest->target_action === 'reschedule'
                ? $this->resolveApplyCustomerPriceAdjustment(
                    $company,
                    $request->boolean('apply_customer_price_adjustment', true),
                )
                : true;

            $this->applyApprovedModificationAction(
                $bookingActionRequest,
                $company,
                request()->user(),
                $applyCustomerPriceAdjustment,
            );

            return back()->with('success', 'Booking action request approved.');
        }

        $this->applyBookingAction(
            $bookingActionRequest->booking,
            $bookingActionRequest->target_action,
            $bookingActionRequest,
            $company,
            request()->user()
        );

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

        $this->applyBookingAction(
            $booking,
            $action,
            null,
            $company,
            $request->user(),
            [
                'booking_id' => $booking->id,
                'requester_company_id' => $company->id,
                'requester_user_id' => $request->user()->id,
                'target_action' => $action,
                'reason' => $request->string('reason')->trim()->toString() ?: null,
            ]
        );

        return back()->with('success', 'Booking '.($action === 'cancel' ? 'cancelled' : 'refunded').'.');
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function handleModificationAction(
        Company $company,
        Booking $booking,
        string $action,
        Request $request,
        array $payload,
        \Closure $applyCallback,
        string $notificationStage
    ): RedirectResponse {
        $companyType = $company->type->value ?? $company->type;
        $reason = $request->string('reason')->trim()->toString() ?: null;

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
                    'reason' => $reason,
                    'payload' => $payload,
                ]
            );

            return back()->with('success', ucfirst($action).' request sent to vendor.');
        }

        abort_unless($companyType === 'vendor', 404);

        DB::transaction(function () use ($booking, $applyCallback, $company, $request, $action, $reason, $payload, $notificationStage): void {
            $lockedBooking = Booking::query()
                ->whereKey($booking->id)
                ->lockForUpdate()
                ->firstOrFail();

            $updatedBooking = $applyCallback($lockedBooking);

            BookingActionRequest::query()->create([
                'booking_id' => $lockedBooking->id,
                'requester_company_id' => $company->id,
                'requester_user_id' => $request->user()->id,
                'target_action' => $action,
                'status' => 'approved',
                'reason' => $reason,
                'payload' => $payload,
                'reviewer_company_id' => $company->id,
                'reviewer_user_id' => $request->user()->id,
                'reviewed_at' => now(),
            ]);

            app(NotifyBookingPaymentEventAction::class)->execute($updatedBooking->fresh(), $notificationStage);
        });

        return back()->with('success', 'Booking '.($action === 'reschedule' ? 'rescheduled' : 'reactivated').'.');
    }

    private function applyApprovedModificationAction(
        BookingActionRequest $bookingActionRequest,
        Company $company,
        ?User $reviewerUser,
        bool $applyCustomerPriceAdjustment = true,
    ): void {
        $notificationStage = $bookingActionRequest->target_action === 'reschedule'
            ? 'booking_rescheduled'
            : 'booking_reactivated';

        DB::transaction(function () use (
            $bookingActionRequest,
            $company,
            $reviewerUser,
            $notificationStage,
            $applyCustomerPriceAdjustment,
        ): void {
            $lockedRequest = BookingActionRequest::query()
                ->whereKey($bookingActionRequest->id)
                ->lockForUpdate()
                ->firstOrFail();

            abort_unless($lockedRequest->status === 'pending', 422);

            $lockedBooking = Booking::query()
                ->whereKey($lockedRequest->booking_id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedRequest->target_action === 'reschedule') {
                $scheduleId = (int) data_get($lockedRequest->payload, 'requested_schedule_id');

                $schedule = TourSchedule::query()
                    ->whereKey($scheduleId)
                    ->where('tour_id', $lockedBooking->tour_id)
                    ->where('company_id', $lockedBooking->vendor_id)
                    ->firstOrFail();

                $lockedRequest->update([
                    'payload' => array_merge(
                        is_array($lockedRequest->payload) ? $lockedRequest->payload : [],
                        ['apply_customer_price_adjustment' => $applyCustomerPriceAdjustment],
                    ),
                ]);

                $updatedBooking = app(RescheduleBookingAction::class)->execute(
                    $lockedBooking,
                    $schedule,
                    $applyCustomerPriceAdjustment,
                );
            } else {
                $updatedBooking = app(ReactivateBookingAction::class)->execute($lockedBooking);
            }

            $lockedRequest->update([
                'status' => 'approved',
                'reviewer_company_id' => $company->id,
                'reviewer_user_id' => $reviewerUser?->id,
                'reviewed_at' => now(),
            ]);

            app(NotifyBookingPaymentEventAction::class)->execute($updatedBooking->fresh(), $notificationStage);
        });
    }

    /**
     * @return array<string, mixed>
     */
    private function buildReschedulePayload(
        Booking $booking,
        TourSchedule $schedule,
        bool $applyCustomerPriceAdjustment = true,
    ): array {
        $rescheduleAction = app(RescheduleBookingAction::class);
        $pricePreview = $rescheduleAction->previewPricingChange($booking, $schedule);

        return [
            'requested_departure_date' => Carbon::parse($schedule->departure_date)->toDateString(),
            'requested_schedule_id' => $schedule->id,
            'previous_departure_date' => Carbon::parse($booking->departure_date)->toDateString(),
            'previous_status' => $this->bookingStatusValue($booking),
            'price_before' => (float) $booking->grand_total,
            'price_after' => $pricePreview['grand_total'],
            'price_difference' => $pricePreview['price_difference'],
            'pax_total' => (int) ($booking->pax_adult ?? 0) + (int) ($booking->pax_child ?? 0),
            'apply_customer_price_adjustment' => $applyCustomerPriceAdjustment,
        ];
    }

    private function resolveApplyCustomerPriceAdjustment(Company $company, bool $requested): bool
    {
        $companyType = $company->type->value ?? $company->type;

        if ($companyType !== 'vendor') {
            return true;
        }

        return $requested;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function latestApprovedReschedulePayload(Booking $booking): ?array
    {
        $payload = BookingActionRequest::query()
            ->where('booking_id', $booking->id)
            ->where('target_action', 'reschedule')
            ->where('status', 'approved')
            ->orderByDesc('reviewed_at')
            ->orderByDesc('id')
            ->value('payload');

        return is_array($payload) ? $payload : null;
    }

    private function effectiveGrandTotalForPayment(Booking $booking, float $paidAmount): float
    {
        $grandTotal = (float) $booking->grand_total;
        $payload = $this->latestApprovedReschedulePayload($booking);

        if ($payload === null) {
            return $grandTotal;
        }

        if (data_get($payload, 'apply_customer_price_adjustment', true) !== false) {
            return $grandTotal;
        }

        $priceBefore = (float) data_get($payload, 'price_before', $grandTotal);

        return min($grandTotal, $priceBefore);
    }

    private function assertNoPendingBookingActionRequest(Booking $booking): void
    {
        $hasPending = BookingActionRequest::query()
            ->where('booking_id', $booking->id)
            ->where('status', 'pending')
            ->exists();

        if ($hasPending) {
            throw ValidationException::withMessages([
                'booking_action' => 'This booking already has a pending correction request.',
            ]);
        }
    }

    /**
     * @param  array{booking_id: int, requester_company_id: int, requester_user_id: int, target_action: string, reason: string|null}|null  $approvedActionRequestAttributes
     */
    private function applyBookingAction(
        Booking $booking,
        string $action,
        ?BookingActionRequest $approvedActionRequest = null,
        ?Company $reviewerCompany = null,
        ?User $reviewerUser = null,
        ?array $approvedActionRequestAttributes = null
    ): void {
        $lockedBooking = DB::transaction(function () use ($booking, $action, $approvedActionRequest, $reviewerCompany, $reviewerUser, $approvedActionRequestAttributes): Booking {
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

                $this->markPendingAgentVendorAttemptsInactive($lockedBooking);
            }

            if ($action === 'refund') {
                $lockedBooking->payments()
                    ->where('status', PaymentStatus::PAID->value)
                    ->update(['status' => PaymentStatus::REFUNDED->value]);

                $lockedBooking->payments()
                    ->whereIn('status', [PaymentStatus::UNPAID->value, PaymentStatus::PENDING->value])
                    ->update(['status' => PaymentStatus::CANCELLED->value]);

                $this->markPendingAgentVendorAttemptsInactive($lockedBooking);
            }

            $reviewedAt = now();

            if ($approvedActionRequest instanceof BookingActionRequest) {
                $approvedActionRequest->update([
                    'status' => 'approved',
                    'reviewer_company_id' => $reviewerCompany?->id,
                    'reviewer_user_id' => $reviewerUser?->id,
                    'reviewed_at' => $reviewedAt,
                ]);
            }

            if ($approvedActionRequestAttributes !== null) {
                BookingActionRequest::query()->create([
                    ...$approvedActionRequestAttributes,
                    'status' => 'approved',
                    'reviewer_company_id' => $reviewerCompany?->id,
                    'reviewer_user_id' => $reviewerUser?->id,
                    'reviewed_at' => $reviewedAt,
                ]);
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

        if (in_array($this->bookingStatusValue($booking), $allowedStatuses, true)) {
            return;
        }

        throw ValidationException::withMessages([
            'booking_action' => 'This booking cannot be '.($action === 'cancel' ? 'cancelled' : 'refunded').' from its current status.',
        ]);
    }

    private function markPendingAgentVendorAttemptsInactive(Booking $booking): void
    {
        $booking->payments()
            ->where('status', PaymentStatus::CANCELLED->value)
            ->get()
            ->filter(fn (Payment $payment): bool => data_get($payment->payload, 'payment_flow_stage') === BookingPaymentWorkflowService::STAGE_AGENT_TO_VENDOR
                && data_get($payment->payload, 'vendor_review_status') === BookingPaymentWorkflowService::REVIEW_PENDING)
            ->each(function (Payment $payment): void {
                $payment->update([
                    'payload' => array_merge($payment->payload ?? [], [
                        'vendor_review_status' => 'cancelled',
                        'cancelled_at' => now()->toISOString(),
                    ]),
                ]);
            });
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
            $paymentWorkflow = app(BookingPaymentWorkflowService::class);

            if ($paymentWorkflow->isAgentToVendorPayment($payment)) {
                $paymentWorkflow->declineAgentVendorPaymentByVendor($payment, request()->user());

                $booking->update([
                    'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
                    'reserved_expires_at' => null,
                ]);

                app(NotifyBookingPaymentEventAction::class)->execute($booking->fresh(), 'manual_payment_declined', $payment->fresh());

                return;
            }

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
        $this->sendBookingContactPaymentReviewEmail($company, $booking->fresh(['tour', 'user']), $payment->fresh(), 'declined');

        return back()->with('success', 'Manual payment declined and booking cancelled.');
    }

    private function sendBookingContactPaymentReviewEmail(Company $company, Booking $booking, Payment $payment, string $decision): void
    {
        $recipientEmail = $booking->contact_email;

        if (! filled($recipientEmail)) {
            return;
        }

        $attachment = $decision === 'accepted'
            ? $this->buildBookingContactInvoiceAttachment($company, $booking)
            : null;

        try {
            Notification::route('mail', $recipientEmail)
                ->notify(new BookingPaymentReviewStatusNotification(
                    $booking,
                    $payment,
                    $company,
                    $decision,
                    $attachment['data'] ?? null,
                    $attachment['name'] ?? null,
                ));
        } catch (\Throwable $exception) {
            report($exception);
        }
    }

    /**
     * @return array{data: string, name: string}|null
     */
    private function buildBookingContactInvoiceAttachment(Company $company, Booking $booking): ?array
    {
        if (! in_array($this->bookingStatusValue($booking), self::INVOICEABLE_STATUSES, true)) {
            return null;
        }

        $booking->loadMissing([
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
        $booking = app(BookingPricingService::class)->reconcileSnapshotTotals($booking);

        $paidPayments = $booking->payments
            ->filter(fn (Payment $payment): bool => $payment->status === PaymentStatus::PAID)
            ->sortBy(fn (Payment $payment): string => (string) ($payment->paid_at ?? $payment->created_at))
            ->values();

        if ($paidPayments->isEmpty()) {
            return null;
        }

        $paymentReceiver = app(BookingPaymentReceiverService::class)->resolveForBooking($booking);
        $invoiceType = collect($this->invoiceOptions($company, $booking, $paymentReceiver['payment_mode']))
            ->pluck('type')
            ->first(fn (string $type): bool => in_array($type, ['agent_to_customer', 'vendor_to_customer'], true));

        if (! $invoiceType) {
            return null;
        }

        $paymentDate = $paidPayments->last()?->paid_at ?? $paidPayments->last()?->created_at;
        $invoiceSchedule = $this->resolveInvoiceSchedule($booking);
        $priceBreakdown = $this->buildInvoicePriceBreakdown($booking, $invoiceSchedule);
        $taxableAddonRows = $booking->addons
            ->filter(fn ($addon): bool => (bool) $addon->is_taxable)
            ->values();
        $nonTaxableAddonRows = $booking->addons
            ->filter(fn ($addon): bool => ! $addon->is_taxable)
            ->values();
        $paymentDetails = $this->buildInvoicePaymentDetails($booking, $taxableAddonRows, $invoiceSchedule);
        $paymentDetailsTotal = (float) collect($paymentDetails)->sum('amount');
        $vatAmount = (float) $booking->tax_amount;
        $isProforma = $this->bookingStatusValue($booking) === BookingStatus::DOWN_PAYMENT->value;
        $paidAmount = (float) $paidPayments->sum('amount');
        $invoiceGrandTotal = (float) $booking->grand_total;
        $invoiceNumber = $booking->booking_number;
        $issuer = $invoiceType === 'agent_to_customer'
            ? $booking->agent
            : ($booking->vendor ?? $booking->tour?->company);
        $customerName = $booking->contact_name ?: $booking->user?->name;
        $customerEmail = $booking->contact_email ?: $booking->user?->email;
        $customerPhone = $booking->contact_phone ?: $booking->user?->phone;
        $vatRate = $this->resolveInvoiceVatRate($booking);
        $deadline = $this->deadlinePayload($booking, $this->vendorSettings($booking)?->full_payment_deadline);
        $filename = ($isProforma ? 'Proforma_Invoice_' : 'Invoice_').$invoiceNumber.'.pdf';

        $pdf = Pdf::setOption(['isRemoteEnabled' => true])
            ->loadView('exports.booking-invoice', [
                'booking' => $booking,
                'agent' => $issuer,
                'logoSrc' => $this->resolveCompanyLogoSrc($issuer),
                'customerName' => $customerName,
                'billedToName' => $customerName,
                'billedToEmail' => $customerEmail,
                'billedToPhone' => $customerPhone,
                'billedToAddress' => null,
                'paymentDate' => $paymentDate,
                'invoiceDate' => $booking->created_at,
                'dueDate' => $deadline['date'] ?? null,
                'returnDate' => $invoiceSchedule?->return_date,
                'paidAmount' => $paidAmount,
                'priceBreakdown' => $priceBreakdown,
                'paymentDetails' => $paymentDetails,
                'paymentDetailsTotal' => $paymentDetailsTotal,
                'vatRate' => $vatRate,
                'platformFeeAmount' => (float) $booking->platform_fee,
                'nonTaxableAddonSummaryRows' => $nonTaxableAddonRows
                    ->map(fn ($addon): array => [
                        'label' => $addon->name ?: 'Add-on',
                        'amount' => (float) $addon->price,
                    ])
                    ->concat($this->nonTaxableVisaSummaryRows($booking))
                    ->values()
                    ->all(),
                'invoiceGrandTotal' => $invoiceGrandTotal,
                'invoiceNumber' => $invoiceNumber,
                'isProforma' => $isProforma,
                'paymentInstructions' => $isProforma
                    ? $this->proformaPaymentInstructions($issuer, $invoiceType)
                    : [],
            ])
            ->setPaper('A4', 'portrait');

        return [
            'data' => $pdf->output(),
            'name' => $filename,
        ];
    }

    /**
     * Shared method to load booking data with all required relationships
     * and supplemental data (tourPrices, addOns) for the wizard view.
     */
    private function renderBookingPage(Company $company, Booking $booking, string $page): Response
    {
        $booking->load([
            'tour',
            'tour.visaCategory.items',
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
        $booking = app(BookingPricingService::class)->reconcileSnapshotTotals($booking);

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
                            'isTaxable' => (bool) ($savedAddon?->is_taxable ?? $addon->is_taxable),
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
                        'isTaxable' => (bool) $bookingAddon->is_taxable,
                    ];
                }
            }
        }

        $downPaymentRule = app(BookingDownPaymentRuleService::class)->resolveForBooking($booking);
        $minimumDownPaymentPct = $downPaymentRule !== null
            && $downPaymentRule['mode'] === BookingDownPaymentRuleService::MODE_GRAND_TOTAL_PERCENT
            ? $downPaymentRule['percent']
            : null;
        $paymentReceiver = app(BookingPaymentReceiverService::class)->resolveForBooking($booking);
        $customerFacingInvoiceType = collect($this->invoiceOptions($company, $booking, $paymentReceiver['payment_mode'], true))
            ->pluck('type')
            ->first(fn (string $type): bool => in_array($type, ['agent_to_customer', 'vendor_to_customer'], true));
        $paymentReceiverSettings = $paymentReceiver['settings'];
        $paymentWorkflowService = app(BookingPaymentWorkflowService::class);
        $paidAmount = $paymentWorkflowService->finalizablePaidAmount($booking);
        $downPaymentPaidAt = $paymentWorkflowService->finalizablePaidPayments($booking)
            ->filter(fn (Payment $payment): bool => $payment->bookingPaymentType() === 'down_payment')
            ->sortByDesc(fn (Payment $payment): string => (string) ($payment->paid_at ?? $payment->created_at))
            ->first();
        $remainingBalance = max(0.0, (float) $booking->grand_total - $paidAmount);
        $booking->commission_amount = $this->resolveCommissionAmount($booking);
        $booking->input_by = $this->inputByPayload($booking);
        [$fullPaymentAvailable, $paymentUnavailableReason] = $this->fullPaymentAvailabilityForBooking($booking, $remainingBalance);
        $editMode = $this->resolveEditMode($booking);

        return Inertia::render($page, [
            'booking' => $booking,
            'tourPrices' => $tourPrices,
            'addOns' => $addOns,
            'visaCategoryItems' => $tour ? $this->visaCategoryItemsPayload($tour) : [],
            'minimumDownPaymentPct' => $minimumDownPaymentPct,
            'downPaymentRule' => $downPaymentRule,
            'minimumVatPct' => $this->resolveInvoiceVatRate($booking),
            'platformFeePerPax' => app(BookingPricingService::class)->platformFeePerPax(),
            'downPaymentAvailable' => $downPaymentRule !== null,
            'fullPaymentAvailable' => $fullPaymentAvailable,
            'paymentUnavailableReason' => $paymentUnavailableReason,
            'paidAmount' => $paidAmount,
            'remainingBalance' => $remainingBalance,
            'downPaymentPaidAt' => $downPaymentPaidAt ? $this->paymentDisplayDate($downPaymentPaidAt) : null,
            'bookingSeatLimit' => $this->bookingSeatLimit($booking),
            'vendorBankInfo' => [
                'bankName' => $paymentReceiverSettings?->manual_bank_transfer ?? '',
                'accountName' => $paymentReceiverSettings?->manual_bank_transfer_account_name ?? '',
                'accountNumber' => $paymentReceiverSettings?->manual_bank_transfer_account_number ?? '',
            ],
            'customerFacingInvoiceType' => $customerFacingInvoiceType,
            'editMode' => $editMode,
            'canEditDocuments' => $this->canEditTravelDocuments($booking),
        ]);
    }

    private function buildInvoicePriceBreakdown(Booking $booking, ?TourSchedule $schedule = null): array
    {
        $schedule ??= $this->resolveInvoiceSchedule($booking);

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

    /**
     * @return array<int, array{id: int, description: string, price: float, isTaxable: bool}>
     */
    private function visaCategoryItemsPayload(Tour $tour): array
    {
        $tour->loadMissing('visaCategory.items');

        return $tour->visaCategory?->items
            ->sortBy('sort_order')
            ->values()
            ->map(fn ($item): array => [
                'id' => (int) $item->id,
                'description' => (string) $item->description,
                'price' => (float) $item->price,
                'isTaxable' => (bool) $item->is_taxable,
            ])
            ->all() ?? [];
    }

    private function buildInvoicePaymentDetails(Booking $booking, ?Collection $taxableAddons = null, ?TourSchedule $schedule = null): array
    {
        $schedule ??= $this->resolveInvoiceSchedule($booking);

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

        $taxableVisaRows = $this->visaPaymentRows($booking->passengers, true);

        $addonRows = ($taxableAddons ?? $booking->addons)
            ->map(function ($addon): array {
                $quantity = (int) ($addon->qty ?? 1);
                $unitPrice = (float) $addon->price;

                return [
                    'description' => $addon->name ?: 'Add-on',
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'discount' => 0.0,
                    'amount' => $unitPrice * $quantity,
                ];
            });

        return $passengerRows
            ->concat($taxableVisaRows)
            ->concat($addonRows)
            ->values()
            ->all();
    }

    private function visaPaymentRows(Collection $passengers, bool $taxable): Collection
    {
        return $passengers
            ->filter(fn ($passenger): bool => (float) $passenger->visa_type_price > 0
                && (bool) $passenger->visa_type_is_taxable === $taxable)
            ->groupBy(fn ($passenger): string => implode('|', [
                (string) $passenger->visa_type_description,
                (string) $passenger->visa_type_price,
            ]))
            ->map(function (Collection $group): array {
                $first = $group->first();
                $description = (string) ($first->visa_type_description ?: 'Visa Type');

                return [
                    'description' => 'Visa: '.$description,
                    'quantity' => $group->count(),
                    'unit_price' => (float) $first->visa_type_price,
                    'discount' => 0.0,
                    'amount' => (float) $group->sum('visa_type_price'),
                ];
            })
            ->values();
    }

    private function nonTaxableVisaSummaryRows(Booking $booking): Collection
    {
        return $this->visaPaymentRows($booking->passengers, false)
            ->map(fn (array $row): array => [
                'label' => $row['description'].' (x'.$row['quantity'].')',
                'amount' => (float) $row['amount'],
            ]);
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
        if ($booking->tax_rate !== null) {
            return (float) $booking->tax_rate;
        }

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
     * @return array<string, mixed>
     */
    private function paymentReviewPayload(Booking $booking, Payment $payment): array
    {
        $paymentWorkflow = app(BookingPaymentWorkflowService::class);
        $proofPath = data_get($payment->payload, 'proof_path');
        $customerPayment = $paymentWorkflow->isAgentToVendorPayment($payment)
            ? $paymentWorkflow->customerPaymentForAgentVendorPayment($booking, $payment)
            : ($paymentWorkflow->isCustomerToAgentPayment($payment) ? $payment : null);

        return [
            'id' => $payment->id,
            'provider' => $payment->provider,
            'payment_method' => $payment->payment_method,
            'status' => $payment->status->value,
            'payment_flow_stage' => data_get($payment->payload, 'payment_flow_stage'),
            'sender_bank_name' => data_get($payment->payload, 'sender_bank'),
            'sender_account_number' => data_get($payment->payload, 'sender_account'),
            'transfer_amount' => (float) $payment->amount,
            'proof_path' => $proofPath,
            'proof_url' => $proofPath ? Storage::disk('public')->url($proofPath) : null,
            'payment_type' => $payment->bookingPaymentType(),
            'payment_date' => data_get($payment->payload, 'payment_date') ?: ($payment->paid_at ?? $payment->created_at)?->toJSON(),
            'receipt' => $this->paymentReceiptPayload($payment),
            'customer_payment' => $customerPayment ? $this->paymentReviewItemPayload($customerPayment) : null,
            'agent_vendor_payment' => $paymentWorkflow->isAgentToVendorPayment($payment)
                ? $this->paymentReviewItemPayload($payment)
                : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function paymentReviewItemPayload(Payment $payment): array
    {
        $proofPath = data_get($payment->payload, 'proof_path');

        return [
            'id' => $payment->id,
            'provider' => $payment->provider,
            'payment_method' => $payment->payment_method,
            'status' => $payment->status->value,
            'payment_flow_stage' => data_get($payment->payload, 'payment_flow_stage'),
            'sender_bank_name' => data_get($payment->payload, 'sender_bank'),
            'sender_account_number' => data_get($payment->payload, 'sender_account'),
            'transfer_amount' => (float) $payment->amount,
            'proof_path' => $proofPath,
            'proof_url' => $proofPath ? Storage::disk('public')->url($proofPath) : null,
            'payment_type' => $payment->bookingPaymentType(),
            'payment_date' => data_get($payment->payload, 'payment_date') ?: ($payment->paid_at ?? $payment->created_at)?->toJSON(),
            'receipt' => $this->paymentReceiptPayload($payment),
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
    private function invoiceOptions(
        Company $company,
        Booking $booking,
        ?string $paymentMode = null,
        bool $allowProforma = false,
    ): array {
        if (
            ! $allowProforma
            && ! in_array($this->bookingStatusValue($booking), self::INVOICEABLE_STATUSES, true)
        ) {
            return [];
        }

        $companyType = $company->type->value ?? $company->type;
        $paymentMode ??= app(BookingPaymentReceiverService::class)
            ->resolveForBooking($booking)['payment_mode'];
        $orderSource = $this->bookingOrderSource($booking);
        $isProforma = $allowProforma
            || $this->bookingStatusValue($booking) === BookingStatus::DOWN_PAYMENT->value;
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
        $paymentWorkflow = app(BookingPaymentWorkflowService::class);
        $paidPayments = $booking->payments
            ->filter(fn (Payment $payment): bool => $payment->status === PaymentStatus::PAID
                && $paymentWorkflow->paymentCountsTowardBookingTotal($payment))
            ->sortBy(fn (Payment $payment): string => (string) ($payment->paid_at ?? $payment->created_at))
            ->values();

        if ($paymentType === 'full_payment') {
            $typedFullPayments = $paidPayments
                ->filter(fn (Payment $payment): bool => $this->bookingPaymentType($payment) === 'full_payment')
                ->values();

            if ($typedFullPayments->count() > 1) {
                return $this->combinedFullPaymentDetailPayload($booking, $typedFullPayments, $paymentReceiverService);
            }
        }

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

        $detail = $this->singlePaymentDetailPayload($booking, $payment, $paymentType, $paymentReceiverService);
        $receiptGroup = $this->paymentReceiptGroupPayload($booking, $payment, $paymentType, $paymentReceiverService);

        if ($receiptGroup !== null) {
            $detail['receipt_group'] = $receiptGroup;
        }

        return $detail;
    }

    /**
     * @param  Collection<int, Payment>  $fullPayments
     * @return array<string, mixed>
     */
    private function combinedFullPaymentDetailPayload(
        Booking $booking,
        Collection $fullPayments,
        BookingPaymentReceiverService $paymentReceiverService,
    ): array {
        $latestPayment = $fullPayments->last();
        $detail = $this->singlePaymentDetailPayload($booking, $latestPayment, 'full_payment', $paymentReceiverService);
        $detail['amount'] = round($fullPayments->sum(fn (Payment $payment): float => (float) $payment->amount), 2);

        $agentReceiptGroup = $this->paymentReceiptGroupPayload($booking, $latestPayment, 'full_payment', $paymentReceiverService);

        if ($agentReceiptGroup !== null) {
            $detail['receipt_group'] = $agentReceiptGroup;

            return $detail;
        }

        $detail['receipt_group'] = $fullPayments
            ->values()
            ->map(function (Payment $payment, int $index) use ($booking, $fullPayments, $paymentReceiverService): array {
                $title = match (true) {
                    $index === 0 => 'Original Full Payment',
                    $index === 1 && $fullPayments->count() === 2 => 'Additional Payment (Reschedule)',
                    default => 'Additional Payment '.($index + 1),
                };

                return [
                    'title' => $title,
                    'detail' => $this->singlePaymentDetailPayload($booking, $payment, 'full_payment', $paymentReceiverService),
                ];
            })
            ->all();

        return $detail;
    }

    /**
     * @return array<string, mixed>
     */
    private function singlePaymentDetailPayload(
        Booking $booking,
        Payment $payment,
        string $paymentType,
        BookingPaymentReceiverService $paymentReceiverService
    ): array {
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

    /**
     * @return array<int, array{title: string, detail: array<string, mixed>}>|null
     */
    private function paymentReceiptGroupPayload(
        Booking $booking,
        Payment $payment,
        string $paymentType,
        BookingPaymentReceiverService $paymentReceiverService
    ): ?array {
        $paymentWorkflow = app(BookingPaymentWorkflowService::class);

        if (! $paymentWorkflow->isCustomerToAgentPayment($payment)) {
            return null;
        }

        $agentVendorPayment = $booking->payments
            ->filter(fn (Payment $candidate): bool => $paymentWorkflow->isAgentToVendorPayment($candidate)
                && (int) data_get($candidate->payload, 'linked_customer_payment_id') === (int) $payment->id
                && $candidate->status === PaymentStatus::PAID
                && data_get($candidate->payload, 'vendor_review_status') === BookingPaymentWorkflowService::REVIEW_APPROVED)
            ->sortByDesc(fn (Payment $candidate): string => (string) ($candidate->paid_at ?? $candidate->created_at))
            ->first();

        if (! $agentVendorPayment) {
            return null;
        }

        return [
            [
                'title' => 'Customer to Agent',
                'detail' => $this->singlePaymentDetailPayload($booking, $payment, $paymentType, $paymentReceiverService),
            ],
            [
                'title' => 'Agent to Vendor',
                'detail' => $this->singlePaymentDetailPayload($booking, $agentVendorPayment, $paymentType, $paymentReceiverService),
            ],
        ];
    }

    private function reconcilePaidBookingStatusIfStale(Booking $booking): Booking
    {
        if (! in_array($this->bookingStatusValue($booking), self::PAID_STATUS_RECONCILABLE_STATUSES, true)) {
            return $booking;
        }

        $paymentWorkflow = app(BookingPaymentWorkflowService::class);
        $paidAmount = $paymentWorkflow->finalizablePaidAmount($booking);

        if ($paidAmount <= 0) {
            return $booking;
        }

        $latestPaidPayment = $paymentWorkflow->latestFinalizablePaidPayment($booking);

        app(FinalizeBookingPaymentAction::class)->reconcilePaidStatusIfStale($booking, $latestPaidPayment);

        $booking->refresh();
        $booking->load([
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
        ]);
        $booking->loadSum(['payments as paid_amount' => function ($query): void {
            $query->where('status', PaymentStatus::PAID->value);
        }], 'amount');

        return $booking;
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

        $gateway = Payment::gatewayNotificationData($payment->payload ?? []);

        return [
            'type' => 'online',
            'url' => null,
            'provider' => $payment->provider,
            'method' => (string) (data_get($gateway, 'payment_type') ?: $payment->payment_method),
            'order_id' => data_get($payment->payload, 'order_id') ?: data_get($gateway, 'order_id'),
            'transaction_id' => data_get($gateway, 'transaction_id'),
            'status' => data_get($gateway, 'transaction_status') ?: $payment->status->value,
            'raw' => null,
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
            app(BookingPaymentWorkflowService::class)->canCompanyReviewPayment($company, $booking, $payment),
            403
        );
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
        $commissionAmount = (float) app(BookingPricingService::class)->quoteForBooking($booking)['agent_commission'];

        if ($commissionAmount > 0) {
            return $commissionAmount;
        }

        return $this->fallbackTourPriceCommissionAmount($booking);
    }

    private function fallbackTourPriceCommissionAmount(Booking $booking): float
    {
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

                    return $this->fallbackCommissionForTourPrice($tourPrice, (float) $passenger->price_amount);
                });
        }

        $tourPrice = $tourPrices->first();
        $paxCount = (int) $booking->pax_adult + (int) $booking->pax_child;

        return $this->fallbackCommissionForTourPrice($tourPrice, (float) $tourPrice->price) * $paxCount;
    }

    private function fallbackCommissionForTourPrice(TourPrice $tourPrice, float $priceAmount): float
    {
        return (float) app(AgentCommissionResolver::class)->fallback($tourPrice, $priceAmount)['amount'];
    }

    private function categoryKey(string $categoryName): string
    {
        return mb_strtolower(trim($categoryName));
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
            return max(0, $booking->seatTakingPaxCount());
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

        return max(0, $booking->seatTakingPaxCount());
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
        ], true)) {
            return 'documents';
        }

        return 'readonly';
    }

    private function canEditTravelDocuments(Booking $booking): bool
    {
        return in_array($booking->status, [
            BookingStatus::WAITING_PAYMENT_APPROVAL,
            BookingStatus::DOWN_PAYMENT,
            BookingStatus::FULL_PAYMENT,
        ], true);
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

    private function missingDocumentPassengerCount(Booking $booking): int
    {
        return app(BookingTravelDocumentService::class)->missingPassengerCount($booking);
    }

    /**
     * @return array<string, mixed>
     */
    private function paymentFollowupPayload(Company $company, Booking $booking, ?float $effectiveGrandTotal = null): array
    {
        $status = $this->bookingStatusValue($booking);
        $paidAmount = (float) ($booking->paid_amount ?? app(BookingPaymentWorkflowService::class)->finalizablePaidAmount($booking));
        $grandTotalForPayment = $effectiveGrandTotal ?? $this->effectiveGrandTotalForPayment($booking, $paidAmount);
        $remainingBalance = max(0.0, $grandTotalForPayment - $paidAmount);
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
            $creditAmount = max(0.0, $paidAmount - $grandTotalForPayment);
            $reschedulePayload = $this->latestApprovedReschedulePayload($booking);
            $priceAdjustmentWaived = $reschedulePayload !== null
                && data_get($reschedulePayload, 'apply_customer_price_adjustment', true) === false;

            if ($creditAmount > 0.01 && ! $priceAdjustmentWaived) {
                return [
                    ...$basePayload,
                    'state' => 'credit',
                    'label' => 'Credit Balance',
                    'credit_amount' => $creditAmount,
                    'amount_due' => 0.0,
                ];
            }

            return [
                ...$basePayload,
                'state' => 'completed',
                'label' => 'Paid',
            ];
        }

        if ($status === BookingStatus::WAITING_PAYMENT_APPROVAL->value) {
            if (app(BookingPaymentWorkflowService::class)->agentVendorCustomerPaymentForDashboardPayment($company, $booking)) {
                return [
                    ...$basePayload,
                    'state' => ($basePayload['is_overdue'] ? 'overdue' : 'due'),
                    'label' => ($basePayload['is_overdue'] ? 'Payment Overdue' : 'Payment Due'),
                    'action_url' => $this->completePaymentUrl($company, $booking),
                    'action_label' => 'Pay Vendor',
                ];
            }

            if (
                $booking->reserved_type === 'payment_in_progress'
                && ! $this->hasPendingManualPayment($booking)
            ) {
                return [
                    ...$basePayload,
                    'state' => ($basePayload['is_overdue'] ? 'overdue' : 'due'),
                    'label' => ($basePayload['is_overdue'] ? 'Payment Overdue' : 'Payment Due'),
                    'action_url' => $this->completePaymentUrl($company, $booking),
                    'action_label' => 'Complete Payment',
                ];
            }

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

    private function hasPendingManualPayment(Booking $booking): bool
    {
        return $booking->payments->contains(function (Payment $payment): bool {
            return $payment->provider === 'manual'
                && $payment->payment_method === 'bank_transfer'
                && $payment->status === PaymentStatus::PENDING;
        });
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
                'action_label' => 'View Documents',
            ];
        }

        return [
            ...$basePayload,
            'state' => 'incomplete',
            'label' => 'Incomplete',
            'action_url' => route('companies.dashboard.bookings.edit', [$company, $booking], false).'?step=documents',
            'action_label' => 'Complete Documents',
        ];
    }

    /**
     * @return array<string, int|float>
     */
    private function emptyFollowupSummary(): array
    {
        return [
            'payment_overdue' => 0,
            'payment_overdue_amount' => 0,
            'payment_due_soon' => 0,
            'payment_due_soon_amount' => 0,
            'documents_incomplete' => 0,
            'documents_due_soon' => 0,
        ];
    }

    /**
     * @param  array<string, int|float>  $summary
     * @param  array<string, mixed>  $paymentFollowup
     * @param  array<string, mixed>  $documentFollowup
     */
    private function addToFollowupSummary(array &$summary, array $paymentFollowup, array $documentFollowup): void
    {
        if (($paymentFollowup['state'] ?? null) === 'overdue') {
            $summary['payment_overdue']++;
            $summary['payment_overdue_amount'] += (float) ($paymentFollowup['amount_due'] ?? 0);
        }

        if (
            ($paymentFollowup['state'] ?? null) === 'due'
            && $this->isDueSoon($paymentFollowup['days_remaining'] ?? null)
        ) {
            $summary['payment_due_soon']++;
            $summary['payment_due_soon_amount'] += (float) ($paymentFollowup['amount_due'] ?? 0);
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

    private function matchesFollowupFilter(array $paymentFollowup, array $documentFollowup, string $followup): bool
    {
        return match ($followup) {
            'payment_overdue' => ($paymentFollowup['state'] ?? null) === 'overdue',
            'payment_due_soon' => ($paymentFollowup['state'] ?? null) === 'due'
                && $this->isDueSoon($paymentFollowup['days_remaining'] ?? null),
            'documents_incomplete' => ($documentFollowup['state'] ?? null) === 'incomplete',
            'documents_due_soon' => ($documentFollowup['state'] ?? null) === 'incomplete'
                && $this->isDueSoon($documentFollowup['days_remaining'] ?? null),
            default => false,
        };
    }

    private function proformaInvoiceAvailable(Booking $booking): bool
    {
        $status = $this->bookingStatusValue($booking);

        return $status === BookingStatus::DOWN_PAYMENT->value
            || (
                $status === BookingStatus::WAITING_PAYMENT_APPROVAL->value
                && $booking->reserved_type === 'payment_in_progress'
            );
    }

    private function canRenderDashboardProformaInvoice(Booking $booking, Request $request): bool
    {
        if (! $request->boolean('proforma')) {
            return false;
        }

        $status = $this->bookingStatusValue($booking);

        if ($status === BookingStatus::BOOKING_RESERVED->value) {
            return true;
        }

        return $this->proformaInvoiceAvailable($booking);
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

    private function continueBookingUrl(Company $company, Booking $booking): ?string
    {
        if ($this->bookingStatusValue($booking) !== BookingStatus::AWAITING_PAYMENT->value) {
            return null;
        }

        if (! $booking->tour_id || ! $booking->departure_date || blank($booking->booking_number)) {
            return null;
        }

        return route('companies.dashboard.bookings.create', [$company, $booking->tour_id], false).'?'.http_build_query([
            'date' => Carbon::parse($booking->departure_date)->toDateString(),
            'booking_number' => $booking->booking_number,
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
