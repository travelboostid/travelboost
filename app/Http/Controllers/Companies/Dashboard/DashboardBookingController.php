<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Actions\Booking\AssertScheduleSeatAvailabilityAction;
use App\Actions\Booking\ExpireBookingReservationsAction;
use App\Actions\Booking\FinalizeBookingPaymentAction;
use App\Actions\Booking\NotifyBookingPaymentEventAction;
use App\Actions\Booking\ReconcileBookingPaymentAfterRepriceAction;
use App\Actions\Booking\SyncAvailabilityAction;
use App\Enums\BookingAvailabilityContext;
use App\Enums\BookingStatus;
use App\Enums\PaymentMethodStatus;
use App\Enums\PaymentMethodUsageScope;
use App\Enums\PaymentStatus;
use App\Enums\VendorAgentPartnerStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\ResolveDashboardBookingHoldExpiryRequest;
use App\Http\Requests\StoreBookingRequest;
use App\Models\AgentTour;
use App\Models\Booking;
use App\Models\BookingDocument;
use App\Models\Company;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\Role;
use App\Models\Tour;
use App\Models\TourAvailability;
use App\Models\TourPrice;
use App\Models\TourSchedule;
use App\Models\User;
use App\Models\VendorAgentPartner;
use App\Services\AgentCommissionResolver;
use App\Services\BookingAddOnOptionsService;
use App\Services\BookingContactPaymentEmailService;
use App\Services\BookingDownPaymentRuleService;
use App\Services\BookingNumberService;
use App\Services\BookingPaymentReceiverService;
use App\Services\BookingPaymentWorkflowService;
use App\Services\BookingPricingService;
use App\Services\BookingRoomArrangementValidator;
use App\Services\BookingService;
use App\Services\BookingTravelDocumentService;
use App\Services\BookingVisaTypeService;
use App\Services\MidtransService;
use App\Services\PaymentGatewayStatusSyncService;
use App\Services\PrismaLinkException;
use App\Services\PrismaLinkService;
use App\Support\BookingDeparture;
use App\Support\BookingReschedulePayment;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Midtrans\Transaction;
use Throwable;

class DashboardBookingController extends Controller
{
    private const PAYMENT_UNAVAILABLE_MESSAGE = 'Payment is temporarily unavailable. Please try again later or contact customer support.';

    private const ONLINE_PAYMENT_UNAVAILABLE_MESSAGE = 'Online payment is temporarily unavailable. Please try again later or contact customer support.';

    public function __construct(
        private readonly MidtransService $midtransService,
    ) {}

    /**
     * @var array<string, string>
     */
    private array $roleLabelCache = [];

    public function create(Company $company, Tour $tour): Response
    {
        $this->assertCompanyCanBookTour($company, $tour);

        $tour->load('company.companySetting', 'schedules.availability', 'visaCategory.items');
        $settings = $tour->company?->companySetting;
        $deadlineDays = (int) ($settings?->booking_deadline ?? 0);
        $bookingTimeLimitMinutes = $this->resolveBookingTimeLimitMinutes($tour);
        $downPaymentRule = app(BookingDownPaymentRuleService::class)->resolveForSettings($settings);
        $minimumDownPaymentPct = $downPaymentRule !== null
            && $downPaymentRule['mode'] === BookingDownPaymentRuleService::MODE_GRAND_TOTAL_PERCENT
            ? $downPaymentRule['percent']
            : null;
        $downPaymentAvailable = $downPaymentRule !== null;
        $cutoffDate = now()->addDays($deadlineDays)->toDateString();
        $requestedDepartureDate = request()->string('date')->toString();
        $schedule = $requestedDepartureDate !== ''
            ? $this->resolveActiveSchedule($tour, $requestedDepartureDate, $tour->company_id)
            : null;
        $isScheduleBookable = $schedule !== null
            && $this->isDepartureDateInsideBookingWindow($tour, $requestedDepartureDate);
        $availableSeats = 0;
        $addOns = [];

        if ($schedule) {
            app(ExpireBookingReservationsAction::class)->execute($tour->company, $tour->id);

            $availability = TourAvailability::query()
                ->where('schedule_id', $schedule->id)
                ->where('tour_id', $tour->id)
                ->where('company_id', $tour->company_id)
                ->first();

            $availableSeats = $isScheduleBookable && $availability ? (int) $availability->available : 0;
        }

        $requestedBookingNumber = request()->string('booking_number')->trim()->toString();
        $bookingNumber = null;
        $dashboardUser = request()->user();
        $agent = $this->dashboardAgent($company, $tour);
        $agentOptions = $this->agentOptionsForDashboardBooking($company, $tour);
        $existingBooking = null;

        if ($dashboardUser && $schedule && $isScheduleBookable && $requestedBookingNumber !== '') {
            $existingBooking = Booking::query()
                ->where('booking_number', $requestedBookingNumber)
                ->where('tour_id', $tour->id)
                ->whereDate('departure_date', $requestedDepartureDate)
                ->first();

            if ($existingBooking) {
                $bookingNumber = $existingBooking->booking_number;
                $existingBooking = app(BookingPricingService::class)->reconcileSnapshotTotals($existingBooking);
                $existingBooking = app(ReconcileBookingPaymentAfterRepriceAction::class)
                    ->reconcileStaleStatusIfBalanceDue($existingBooking);
                $existingBooking->load([
                    'inputByCompany:id,name,type',
                    'inputByUser:id,name',
                    'passengers',
                    'rooms',
                    'addons',
                    'user:id,name',
                ]);
            }
        }

        if ($schedule) {
            $addOns = app(BookingAddOnOptionsService::class)->forSchedule($tour, $schedule, $existingBooking);
        }

        if (($company->type->value ?? $company->type) === 'vendor' && $existingBooking?->agent_id) {
            $agent = Company::query()
                ->whereKey($existingBooking->agent_id)
                ->where('type', 'agent')
                ->first();
        }

        $reschedulePayment = app(BookingReschedulePayment::class);
        $paidAmount = $existingBooking
            ? app(BookingPaymentWorkflowService::class)->finalizablePaidAmount($existingBooking)
            : 0.0;
        $remainingBalance = $existingBooking
            ? $reschedulePayment->remainingBalance($existingBooking, $paidAmount)
            : 0.0;
        [$fullPaymentAvailable, $paymentUnavailableReason] = $this->fullPaymentAvailabilityForBooking($existingBooking, $remainingBalance);
        $bookingSeatLimit = $availableSeats + $this->heldSeatCountForBooking(
            $existingBooking,
            $tour->id,
            $this->normalizeDateString($schedule?->departure_date),
            $tour->company_id
        );

        $paymentReceiver = app(BookingPaymentReceiverService::class)
            ->resolveForTourAndTenant($tour, $agent);
        $paymentReceiverSettings = $paymentReceiver['settings'];
        $paymentReceiverPartnership = $paymentReceiver['partnership'];

        $tour->setRelation(
            'schedules',
            $tour->schedules
                ->filter(fn (TourSchedule $tourSchedule): bool => (bool) $tourSchedule->is_active && $tourSchedule->departure_date >= $cutoffDate)
                ->values()
        );

        return Inertia::render('tours/bookings/create', [
            'tour' => $tour,
            'tourPrices' => $this->tourPricesForSchedule($tour, $schedule, $agentOptions, $agent?->id),
            'vendor' => $tour->company,
            'tenant' => $agent,
            'bookingNumber' => $bookingNumber,
            'existingBooking' => $existingBooking,
            'inputBy' => $existingBooking
                ? $this->inputByPayload($existingBooking)
                : $this->provisionalInputByPayload($dashboardUser, $company),
            'roomTypes' => [],
            'availability' => $availableSeats,
            'bookingSeatLimit' => $bookingSeatLimit,
            'addOns' => $addOns,
            'visaCategoryItems' => $this->visaCategoryItemsPayload($tour),
            'bookingDeadlineDays' => $deadlineDays,
            'bookingTimeLimitMinutes' => $bookingTimeLimitMinutes,
            'downPaymentAvailable' => $downPaymentAvailable,
            'minimumDownPaymentPct' => $minimumDownPaymentPct,
            'downPaymentRule' => $downPaymentRule,
            'minimumVatPct' => (float) ($existingBooking?->tax_rate ?? $settings?->minimum_vat ?? BookingPricingService::DEFAULT_PPN_RATE),
            'platformFeePerPax' => app(BookingPricingService::class)->platformFeePerPax(),
            'vendorBankInfo' => [
                'bankName' => $paymentReceiverSettings?->manual_bank_transfer ?? '',
                'accountName' => $paymentReceiverSettings?->manual_bank_transfer_account_name ?? '',
                'accountNumber' => $paymentReceiverSettings?->manual_bank_transfer_account_number ?? '',
            ],
            'termConditions' => $settings?->term_conditions,
            'isResumingExistingBooking' => $existingBooking !== null,
            'serverNow' => now()->toIso8601String(),
            'reservedExpiresAt' => $existingBooking?->reserved_expires_at?->toIso8601String(),
            'remainingHoldSeconds' => $this->remainingHoldSeconds($existingBooking),
            'paidAmount' => $paidAmount,
            'remainingBalance' => $remainingBalance,
            'fullPaymentAvailable' => $fullPaymentAvailable,
            'paymentMethodAvailability' => [
                'manual' => (bool) ($paymentReceiverPartnership?->manual_payment_enabled ?? true),
                'online' => (bool) ($paymentReceiverPartnership?->online_payment_enabled ?? true),
            ],
            'paymentUnavailableReason' => $paymentUnavailableReason,
            'bookingPaymentResult' => null,
            'savedPassengers' => $this->savedPassengerOptionsForDashboardBooking($company, $schedule?->departure_date),
            'customerOptions' => $this->customerOptionsForDashboardBooking($company),
            'agentOptions' => $agentOptions,
            'requiresAgentSelection' => ($company->type->value ?? $company->type) === 'vendor',
            'bookingConflict' => null,
            'dashboardBookingContext' => [
                'isDashboard' => true,
                'companyUsername' => $company->username,
                'reserveUrl' => route('companies.dashboard.bookings.create.reserve', [$company, $tour], false),
                'storeUrl' => route('companies.dashboard.bookings.create.store', [$company, $tour], false),
                'bookingActionBaseUrl' => "/companies/{$company->username}/dashboard/bookings",
                'returnUrl' => route('companies.dashboard.bookings.index', $company, false),
            ],
        ]);
    }

    public function reserve(Company $company, Tour $tour, Request $request, BookingNumberService $bookingNumberService): RedirectResponse
    {
        $this->assertCompanyCanBookTour($company, $tour);

        $data = $request->validate([
            'tour_id' => ['required', 'exists:tours,id'],
            'departure_date' => ['required', 'date'],
            'pax_adult' => ['required', 'integer', 'min:0'],
            'pax_child' => ['required', 'integer', 'min:0'],
            'pax_infant' => ['required', 'integer', 'min:0'],
            'booking_number' => ['nullable', 'string'],
            'contact_name' => ['nullable', 'string', 'max:255'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:50'],
            'contact_notes' => ['nullable', 'string', 'max:1000'],
            'agent_id' => ['nullable', 'integer', 'exists:companies,id'],
            'addons' => ['nullable', 'array'],
            'addons.*.name' => ['required_with:addons', 'string', 'max:255'],
            'addons.*.price' => ['required_with:addons', 'numeric', 'min:0'],
            'addons.*.qty' => ['nullable', 'integer', 'min:0'],
            'addons.*.is_taxable' => ['nullable', 'boolean'],
            'passengers' => ['required', 'array', 'min:1'],
            'passengers.*.title' => ['nullable', 'string', 'max:20'],
            'passengers.*.first_name' => ['required', 'string', 'max:255'],
            'passengers.*.last_name' => ['nullable', 'string', 'max:255'],
            'passengers.*.dob' => ['nullable', 'date'],
            'passengers.*.pob' => ['nullable', 'string', 'max:255'],
            'passengers.*.price_category' => ['nullable', 'string'],
            'passengers.*.price_amount' => ['nullable', 'numeric'],
            'passengers.*.visa_category_item_id' => ['nullable', 'integer', 'exists:visa_category_items,id'],
            'passengers.*.room_type' => ['nullable', 'string'],
            'passengers.*.note' => ['nullable', 'string', 'max:1000'],
        ]);

        $visaErrors = app(BookingVisaTypeService::class)
            ->validationErrorsForPassengers($tour->loadMissing('visaCategory.items'), $data['passengers'] ?? []);

        if ($visaErrors !== []) {
            throw ValidationException::withMessages($visaErrors);
        }

        $owner = $this->resolveBookingOwner($request, $data);
        $agent = $this->resolveDashboardBookingAgent($company, $tour, data_get($data, 'agent_id'));
        $inputByRole = $this->currentCompanyRoleName($request->user(), $company);
        $bookingTimeLimitMinutes = $this->resolveBookingTimeLimitMinutes($tour);
        app(BookingRoomArrangementValidator::class)->validatePassengerMix($data['passengers'] ?? []);

        $booking = DB::transaction(function () use ($request, $data, $tour, $owner, $agent, $inputByRole, $bookingTimeLimitMinutes, $company, $bookingNumberService): Booking {
            $bookingNumber = $this->resolveDashboardBookingNumber(data_get($data, 'booking_number'), $company, $bookingNumberService);
            $this->transferDashboardPlaceholderOwnership($bookingNumber, $request->user(), $owner);

            $existingBooking = Booking::query()
                ->where('booking_number', $bookingNumber)
                ->lockForUpdate()
                ->first();

            if ($existingBooking) {
                $this->assertDashboardBookingMatchesFlow(
                    $existingBooking,
                    $tour,
                    $company,
                    (string) $data['departure_date']
                );
            }

            $schedule = $this->resolveBookableSchedule($tour, (string) $data['departure_date'], $tour->company_id);
            if (! $schedule) {
                throw ValidationException::withMessages(['departure_date' => 'Booking window closed.']);
            }

            $availability = TourAvailability::query()
                ->where('company_id', $tour->company_id)
                ->where('tour_id', $tour->id)
                ->where('schedule_id', $schedule->id)
                ->lockForUpdate()
                ->first();

            if (! $availability) {
                throw ValidationException::withMessages([
                    'availability' => BookingAvailabilityContext::Reserve->message(),
                ]);
            }

            $requestedSeatCount = (int) $data['pax_adult'] + (int) $data['pax_child'];

            app(AssertScheduleSeatAvailabilityAction::class)->assertWithLockedAvailability(
                $availability,
                $tour->id,
                $tour->company_id,
                $this->normalizeDateString($schedule->departure_date),
                $requestedSeatCount,
                $existingBooking?->id,
                BookingAvailabilityContext::Reserve,
            );

            $taxRate = (float) (($existingBooking && $existingBooking->tax_rate !== null)
                ? $existingBooking->tax_rate
                : ($tour->company?->companySetting?->minimum_vat ?? BookingPricingService::DEFAULT_PPN_RATE));

            $quote = app(BookingPricingService::class)->quoteForBookingData(
                $tour,
                (string) $data['departure_date'],
                $data['passengers'],
                $data['addons'] ?? [],
                $taxRate,
                $agent !== null,
                $agent?->id,
            );
            $totals = app(BookingPricingService::class)->bookingTotalsFromQuote($quote);
            $reservedExpiresAt = $existingBooking?->status === BookingStatus::BOOKING_RESERVED
                && $existingBooking->reserved_expires_at
                && $existingBooking->reserved_expires_at->isFuture()
                    ? $existingBooking->reserved_expires_at
                    : now()->addMinutes($bookingTimeLimitMinutes);

            $booking = Booking::updateOrCreate(
                [
                    'booking_number' => $bookingNumber,
                ],
                [
                    'user_id' => $owner->id,
                    'tour_id' => $tour->id,
                    'departure_date' => $data['departure_date'],
                    'pax_adult' => $data['pax_adult'],
                    'pax_child' => $data['pax_child'],
                    'pax_infant' => $data['pax_infant'],
                    'status' => BookingStatus::BOOKING_RESERVED,
                    'reserved_type' => 'system',
                    'reserved_expires_at' => $reservedExpiresAt,
                    'vendor_id' => $tour->company_id,
                    'agent_id' => $agent?->id,
                    'total_price' => $totals['total_price'],
                    'tax_rate' => $totals['tax_rate'],
                    'tax_amount' => $totals['tax_amount'],
                    'platform_fee' => $totals['platform_fee'],
                    'commission_amount' => $totals['commission_amount'],
                    'grand_total' => $totals['grand_total'],
                    'contact_name' => $data['contact_name'] ?? null,
                    'contact_email' => $data['contact_email'] ?? null,
                    'contact_phone' => $data['contact_phone'] ?? null,
                    'contact_notes' => $data['contact_notes'] ?? null,
                    'input_by_user_id' => $request->user()->id,
                    'input_by_company_id' => $company->id,
                    'input_by_role' => $inputByRole,
                ]
            );

            $booking->passengers()->delete();
            $booking->passengers()->createMany($quote['passengers']);

            $booking->rooms()->delete();

            $booking->addons()->delete();
            if (! empty($quote['addons'])) {
                $booking->addons()->createMany($quote['addons']);
            }

            app(SyncAvailabilityAction::class)->syncSchedule($schedule, $tour->company_id);

            return $booking;
        });

        return to_route('companies.dashboard.bookings.create', [
            'company' => $company,
            'tour' => $tour,
            'date' => $this->normalizeDateString($booking->departure_date),
            'booking_number' => $booking->booking_number,
        ]);
    }

    public function store(Company $company, Tour $tour, StoreBookingRequest $request, BookingService $bookingService, BookingNumberService $bookingNumberService): RedirectResponse
    {
        $this->assertCompanyCanBookTour($company, $tour);

        $validated = $request->validated();
        $agent = $this->resolveDashboardBookingAgent($company, $tour, data_get($validated, 'agent_id'));
        $owner = $this->resolveBookingOwner($request, $validated);
        $this->assertPaymentTypeAllowedForTour($tour, (string) $validated['payment_type']);

        $validated['vendor_id'] = $tour->company_id;
        $validated['agent_id'] = $agent?->id;
        $validated['tour_id'] = $tour->id;
        $validated['input_by_user_id'] = $request->user()->id;
        $validated['input_by_company_id'] = $company->id;
        $validated['input_by_role'] = $this->currentCompanyRoleName($request->user(), $company);

        DB::transaction(function () use (
            $validated,
            $company,
            $tour,
            $bookingNumberService,
            $request,
            $owner,
            $bookingService
        ): void {
            $validated['booking_number'] = $this->resolveDashboardBookingNumber(
                data_get($validated, 'booking_number'),
                $company,
                $bookingNumberService
            );

            $this->transferDashboardPlaceholderOwnership(
                (string) $validated['booking_number'],
                $request->user(),
                $owner
            );

            $existingBooking = Booking::query()
                ->where('booking_number', (string) $validated['booking_number'])
                ->lockForUpdate()
                ->first();

            if ($existingBooking) {
                $this->assertDashboardBookingMatchesFlow(
                    $existingBooking,
                    $tour,
                    $company,
                    (string) $validated['departure_date']
                );
            }

            $bookingService->createBooking($validated, $owner);
        });

        return back()->with('success', 'Booking successfully created.');
    }

    public function releaseHold(Company $company, Booking $booking): RedirectResponse
    {
        $this->assertCompanyCanAccessBooking($company, $booking);

        $booking = DB::transaction(function () use ($booking): Booking {
            $lockedBooking = Booking::query()->whereKey($booking->id)->lockForUpdate()->firstOrFail();

            if ($lockedBooking->status === BookingStatus::BOOKING_RESERVED && $lockedBooking->reserved_type === 'system') {
                $lockedBooking->update([
                    'status' => BookingStatus::EXPIRED,
                    'reserved_expires_at' => null,
                ]);
            }

            return $lockedBooking->fresh();
        });

        app(SyncAvailabilityAction::class)->executeForBooking($booking);

        return back()->with('success', 'Booking hold released.');
    }

    public function resolveHoldExpiry(Company $company, Booking $booking, ResolveDashboardBookingHoldExpiryRequest $request): RedirectResponse
    {
        $this->assertCompanyCanAccessBooking($company, $booking);

        $booking = DB::transaction(function () use ($booking, $request): Booking {
            $lockedBooking = Booking::query()->whereKey($booking->id)->lockForUpdate()->firstOrFail();

            $canResolveHold = $lockedBooking->status === BookingStatus::BOOKING_RESERVED
                && $lockedBooking->reserved_type === 'system'
                && $lockedBooking->reserved_expires_at !== null
                && $lockedBooking->reserved_expires_at->lte(now()->addSeconds(5));

            if (! $canResolveHold) {
                return $lockedBooking->fresh();
            }

            if ($request->validated('resolution') === 'payment_in_progress') {
                $lockedBooking->update([
                    'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
                    'reserved_type' => 'payment_in_progress',
                    'reserved_expires_at' => null,
                ]);

                return $lockedBooking->fresh();
            }

            $lockedBooking->update([
                'status' => BookingStatus::AWAITING_PAYMENT,
                'reserved_type' => 'system',
                'reserved_expires_at' => null,
            ]);

            return $lockedBooking->fresh();
        });

        app(SyncAvailabilityAction::class)->executeForBooking($booking);

        return back()->with('success', 'Booking hold resolved.');
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

    public function updateTravelDocuments(Company $company, Booking $booking, Request $request): RedirectResponse
    {
        $this->assertCompanyCanAccessBooking($company, $booking);

        if (BookingDeparture::hasDepartedBooking($booking)) {
            throw ValidationException::withMessages([
                'booking_action' => 'This booking can no longer be modified because the departure date has passed.',
            ]);
        }

        abort_unless(in_array($booking->status, [
            BookingStatus::WAITING_PAYMENT_APPROVAL,
            BookingStatus::DOWN_PAYMENT,
            BookingStatus::FULL_PAYMENT,
        ], true), 422);

        $validated = $request->validate([
            'passengers' => ['required', 'array', 'min:1'],
            'passengers.*.id' => ['required', 'integer', 'exists:booking_passengers,id'],
            'passengers.*.passport_number' => ['nullable', 'string', 'max:255'],
            'passengers.*.passport_issue_date' => ['nullable', 'date'],
            'passengers.*.passport_expiry_date' => ['nullable', 'date'],
            'passengers.*.passport_file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'passengers.*.passport_file_path' => ['nullable', 'string'],
            'passengers.*.visa_number' => ['nullable', 'string', 'max:255'],
            'passengers.*.visa_file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'passengers.*.visa_file_path' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($request, $booking, $validated): void {
            $passengers = $booking->passengers()
                ->whereIn('id', collect($validated['passengers'])->pluck('id'))
                ->get()
                ->keyBy('id');

            foreach ($validated['passengers'] as $index => $passengerData) {
                $passenger = $passengers->get((int) $passengerData['id']);
                abort_unless($passenger, 403);

                $update = Arr::only($passengerData, [
                    'passport_number',
                    'passport_issue_date',
                    'passport_expiry_date',
                    'visa_number',
                ]);

                if ($request->hasFile("passengers.{$index}.passport_file")) {
                    $update['passport_file_path'] = $request->file("passengers.{$index}.passport_file")->store('travel-documents/passports', 'public');
                } else {
                    $update['passport_file_path'] = $passengerData['passport_file_path'] ?? null;
                }

                if ($request->hasFile("passengers.{$index}.visa_file")) {
                    $update['visa_file_path'] = $request->file("passengers.{$index}.visa_file")->store('travel-documents/visas', 'public');
                } else {
                    $update['visa_file_path'] = $passengerData['visa_file_path'] ?? null;
                }

                $passenger->update($update);
            }
        });

        return back()->with('success', 'Travel documents updated.');
    }

    public function storeManualPayment(Company $company, Booking $booking, Request $request): RedirectResponse
    {
        $this->assertCompanyCanAccessBooking($company, $booking);
        $booking = $this->ensureBookingNotExpired($booking);

        $validated = $request->validate([
            'sender_bank_name' => ['required', 'string', 'max:255'],
            'sender_account_number' => ['required', 'string', 'max:255', 'regex:/^\d+$/'],
            'transfer_amount' => ['required', 'numeric', 'min:1'],
            'payment_type' => ['required', 'string', 'in:down_payment,full_payment'],
            'payment_date' => ['required', 'date', 'before_or_equal:today'],
            'proof' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ]);

        $paymentWorkflow = app(BookingPaymentWorkflowService::class);
        $agentVendorCustomerPayment = $paymentWorkflow->agentVendorCustomerPaymentForDashboardPayment($company, $booking);

        if ($agentVendorCustomerPayment) {
            $paymentWorkflow->assertAgentVendorPaymentMatchesCustomerPayment(
                $agentVendorCustomerPayment,
                (float) $validated['transfer_amount'],
                (string) $validated['payment_type']
            );
        } else {
            $this->assertDashboardCanStartPayment($booking, (float) $validated['transfer_amount'], (string) $validated['payment_type']);
        }

        $payment = DB::transaction(function () use ($request, $booking, $validated, $agentVendorCustomerPayment): Payment {
            $paymentWorkflow = app(BookingPaymentWorkflowService::class);
            $paymentReceiver = app(BookingPaymentReceiverService::class)->resolveForBooking($booking);
            $paymentWorkflowPayload = $agentVendorCustomerPayment
                ? $paymentWorkflow->agentVendorPaymentPayload($booking, $agentVendorCustomerPayment, (string) $validated['payment_type'])
                : $paymentWorkflow->initialPaymentPayload($paymentReceiver, (string) $validated['payment_type']);
            $proof = $request->file('proof');
            $path = $proof->store('payment-proofs', 'public');

            $payment = $booking->payments()->create([
                'owner_type' => get_class($request->user()),
                'owner_id' => $request->user()->id,
                'provider' => 'manual',
                'payment_method' => 'bank_transfer',
                'amount' => $validated['transfer_amount'],
                'status' => 'pending',
                'payload' => [
                    'sender_bank' => $validated['sender_bank_name'],
                    'sender_account' => $validated['sender_account_number'],
                    'proof_path' => $path,
                    'payment_date' => Carbon::parse($validated['payment_date'])->toDateString(),
                    ...$paymentWorkflowPayload,
                ],
            ]);

            BookingDocument::create([
                'booking_id' => $booking->id,
                'type' => 'payment_proof',
                'file_path' => $path,
                'file_name' => $proof->getClientOriginalName(),
                'file_size' => $proof->getSize(),
            ]);

            $this->markDashboardBookingManualPaymentInProgress($booking);

            return $payment;
        });

        app(SyncAvailabilityAction::class)->executeForBooking($booking->fresh());
        app(NotifyBookingPaymentEventAction::class)->execute($booking->fresh(), 'manual_payment_submitted', $payment->fresh());

        return back()
            ->with('success', 'Payment proof submitted. We will verify shortly.')
            ->with('bookingPaymentResult', $this->buildBookingPaymentResult($booking->fresh(), $payment->fresh()));
    }

    public function storeOnlinePayment(Company $company, Booking $booking, Request $request): JsonResponse
    {
        $this->assertCompanyCanAccessBooking($company, $booking);
        $booking = $this->ensureBookingNotExpired($booking);

        $validated = $request->validate([
            'payment_type' => ['required', 'string', 'in:down_payment,full_payment'],
            'amount' => ['required', 'numeric', 'min:1'],
            'payment_method_id' => ['required', 'exists:payment_methods,id'],
        ]);

        $paymentMethod = $this->resolveEnabledBookingOnlinePaymentMethod((int) $validated['payment_method_id']);

        $paymentWorkflow = app(BookingPaymentWorkflowService::class);
        $agentVendorCustomerPayment = $paymentWorkflow->agentVendorCustomerPaymentForDashboardPayment($company, $booking);

        if ($agentVendorCustomerPayment) {
            $paymentWorkflow->assertAgentVendorPaymentMatchesCustomerPayment(
                $agentVendorCustomerPayment,
                (float) $validated['amount'],
                (string) $validated['payment_type']
            );
        } else {
            $this->assertDashboardCanStartPayment($booking, (float) $validated['amount'], (string) $validated['payment_type']);
        }

        $paymentWorkflow = app(BookingPaymentWorkflowService::class);
        $paymentReceiver = app(BookingPaymentReceiverService::class)->resolveForBooking($booking);
        $paymentWorkflowPayload = $agentVendorCustomerPayment
            ? $paymentWorkflow->agentVendorPaymentPayload($booking, $agentVendorCustomerPayment, (string) $validated['payment_type'])
            : $paymentWorkflow->initialPaymentPayload($paymentReceiver, (string) $validated['payment_type']);

        return $this->storePrismaLinkOnlinePayment(
            $company,
            $request,
            $booking,
            $validated,
            $agentVendorCustomerPayment !== null,
            $paymentWorkflowPayload,
            $paymentMethod,
        );

        if ($reusablePayment) {
            $this->markDashboardBookingOnlinePaymentInProgress($booking, $agentVendorCustomerPayment !== null);

            return response()->json([
                'payment' => $this->onlinePaymentResponsePayload($reusablePayment->fresh(), true),
                'bookingPaymentResult' => $this->buildBookingPaymentResult($booking->fresh(), $reusablePayment->fresh()),
            ]);
        }

        $payment = DB::transaction(function () use ($request, $booking, $validated, $agentVendorCustomerPayment, $paymentWorkflowPayload, $reusableAttemptService, $paymentMethod): Payment {
            $payment = $booking->payments()->create([
                'owner_type' => get_class($request->user()),
                'owner_id' => $request->user()->id,
                'provider' => 'midtrans',
                'payment_method' => $paymentMethod->method,
                'amount' => $validated['amount'],
                'status' => 'unpaid',
                'payload' => $paymentWorkflowPayload,
            ]);

            $chargeExpiresAt = $reusableAttemptService->newChargeExpiresAt();

            try {
                $chargePayload = $this->midtransService->charge(
                    $payment,
                    $paymentMethod,
                    $request->user(),
                    route('companies.dashboard.bookings.index', request()->route('company'), absolute: true),
                );
            } catch (Throwable $exception) {
                Log::warning('Midtrans Core API charge failed', [
                    'booking_id' => $booking->id,
                    'payment_id' => $payment->id,
                    'payment_type' => $validated['payment_type'],
                    'payment_method' => $paymentMethod->method,
                    'amount' => (float) $payment->amount,
                    'midtrans_environment' => $this->midtransEnvironment(),
                    'message' => $exception->getMessage(),
                ]);

                throw ValidationException::withMessages(['payment' => self::ONLINE_PAYMENT_UNAVAILABLE_MESSAGE]);
            }

            $payment->update([
                'status' => 'pending',
                'payload' => [
                    ...$paymentWorkflowPayload,
                    ...$chargePayload,
                    'charge_expires_at' => $chargeExpiresAt->toISOString(),
                ],
                'expired_at' => $chargeExpiresAt,
            ]);

            $this->markDashboardBookingOnlinePaymentInProgress($booking, $agentVendorCustomerPayment !== null);

            return $payment;
        });

        app(SyncAvailabilityAction::class)->executeForBooking($booking->fresh());
        app(NotifyBookingPaymentEventAction::class)->execute($booking->fresh(), 'online_payment_pending', $payment->fresh());

        return response()->json([
            'payment' => $this->onlinePaymentResponsePayload($payment->fresh(), false),
            'bookingPaymentResult' => $this->buildBookingPaymentResult($booking->fresh(), $payment->fresh()),
        ]);
    }

    private function markDashboardBookingOnlinePaymentInProgress(Booking $booking, bool $agentVendorCustomerPayment): void
    {
        $booking->update([
            'status' => $agentVendorCustomerPayment
                ? BookingStatus::WAITING_PAYMENT_APPROVAL
                : $this->pendingOnlinePaymentBookingStatus($booking),
            'payment_mode' => 'online',
            'reserved_type' => 'payment_in_progress',
            'reserved_expires_at' => null,
        ]);
    }

    private function markDashboardBookingManualPaymentInProgress(Booking $booking): void
    {
        $booking->update([
            'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
            'payment_mode' => 'manual',
            'reserved_type' => 'payment_in_progress',
            'reserved_expires_at' => null,
        ]);
    }

    /**
     * @param  array<string, mixed>  $validated
     * @param  array<string, mixed>  $paymentWorkflowPayload
     */
    private function storePrismaLinkOnlinePayment(
        Company $company,
        Request $request,
        Booking $booking,
        array $validated,
        bool $isAgentVendorCustomerPayment,
        array $paymentWorkflowPayload,
        PaymentMethod $paymentMethod,
    ): JsonResponse {
        $payment = DB::transaction(function () use ($request, $booking, $validated, $isAgentVendorCustomerPayment, $paymentWorkflowPayload, $paymentMethod): Payment {
            $payment = $booking->payments()->create([
                'owner_type' => get_class($request->user()),
                'owner_id' => $request->user()->id,
                'provider' => 'prismalink',
                'payment_method' => $paymentMethod->method,
                'amount' => $validated['amount'],
                'status' => 'unpaid',
                'payload' => $paymentWorkflowPayload,
            ]);

            try {
                $this->initiatePrismaLinkBookingPayment($payment, $paymentMethod, $request, $booking);
            } catch (PrismaLinkException $exception) {
                Log::warning('PrismaLink dashboard booking payment initiation failed', [
                    'booking_id' => $booking->id,
                    'payment_id' => $payment->id,
                    'payment_type' => $validated['payment_type'],
                    'payment_method' => $paymentMethod->method,
                    'amount' => (float) $payment->amount,
                    'message' => $exception->getMessage(),
                    'response_code' => $exception->responseCode,
                ]);

                throw ValidationException::withMessages([
                    'payment' => $exception->getMessage(),
                ]);
            }

            $this->markDashboardBookingOnlinePaymentInProgress($booking, $isAgentVendorCustomerPayment);

            return $payment;
        });

        app(SyncAvailabilityAction::class)->executeForBooking($booking->fresh());
        app(NotifyBookingPaymentEventAction::class)->execute($booking->fresh(), 'online_payment_pending', $payment->fresh());

        return response()->json([
            'payment' => $this->onlinePaymentResponsePayload($payment->fresh(), false),
            'bookingPaymentResult' => $this->buildBookingPaymentResult($booking->fresh(), $payment->fresh()),
        ]);
    }

    private function initiatePrismaLinkBookingPayment(
        Payment $payment,
        PaymentMethod $paymentMethod,
        Request $request,
        Booking $booking,
    ): void {
        $prismaLinkService = app(PrismaLinkService::class);
        $merchantRefNo = $prismaLinkService->buildMerchantRefNo($payment->id);
        $validityHours = (int) config('prismalink.default_validity_hours', 24);
        $paymentMethodCode = $this->prismaLinkPaymentMethodCode($paymentMethod->method);
        $bankId = $this->prismaLinkBankIdFromMeta($paymentMethod->meta);

        $params = [
            'merchant_ref_no' => $merchantRefNo,
            'user_id' => (string) $request->user()->id,
            'user_device_id' => (string) $request->header('X-Device-Id', $request->user()->id),
            'user_ip_address' => $request->ip() ?? '127.0.0.1',
            'product_details' => [[
                'item_code' => 'booking',
                'item_title' => 'Booking '.$booking->booking_number,
                'quantity' => 1,
                'total' => (string) (int) $payment->amount,
                'currency' => 'IDR',
            ]],
            'invoice_number' => 'BK-'.$payment->id,
            'transaction_amount' => (int) $payment->amount,
            'user_name' => (string) $request->user()->name,
            'user_email' => (string) $request->user()->email,
            'remarks' => 'Booking payment: '.$booking->booking_number,
            'backend_callback_url' => $this->prismaLinkBackendCallbackUrl(),
            'frontend_callback_url' => $this->prismaLinkFrontendCallbackUrl(),
        ];

        if ($paymentMethodCode !== null) {
            $params['payment_method'] = $paymentMethodCode;
        }

        if ($paymentMethodCode === 'VA') {
            if ($bankId === null) {
                throw new PrismaLinkException('PrismaLink bank_id is required for virtual account payments.');
            }

            $params['bank_id'] = $bankId;
        }

        $response = $prismaLinkService->submitPaymentPageTransaction($params);
        $expiredAt = filled($response['validity'] ?? null)
            ? Carbon::parse((string) $response['validity'])
            : now()->addHours($validityHours);
        $instructionPayload = $prismaLinkService->extractInstructions(
            $response,
            $paymentMethod->method,
            $bankId,
        );

        $payment->update([
            'status' => 'pending',
            'payload' => [
                ...($payment->payload ?? []),
                'merchant_ref_no' => $merchantRefNo,
                'plink_ref_no' => $response['plink_ref_no'] ?? null,
                'transaction_status' => $response['transaction_status'] ?? null,
                'validity' => $response['validity'] ?? null,
                'charge_expires_at' => $expiredAt->toISOString(),
                ...$instructionPayload,
            ],
            'expired_at' => $expiredAt,
        ]);
    }

    private function resolveEnabledBookingOnlinePaymentMethod(int $paymentMethodId): PaymentMethod
    {
        $paymentMethod = PaymentMethod::query()->find($paymentMethodId);

        if (
            ! $paymentMethod instanceof PaymentMethod
            || $paymentMethod->status !== PaymentMethodStatus::ENABLED
            || $paymentMethod->provider !== 'prismalink'
            || $paymentMethod->usage_scope !== PaymentMethodUsageScope::Booking
        ) {
            throw ValidationException::withMessages([
                'payment_method_id' => 'Selected payment method is not available.',
            ]);
        }

        return $paymentMethod;
    }

    /**
     * @return array<string, mixed>
     */
    private function onlinePaymentResponsePayload(Payment $payment, bool $reused): array
    {
        return [
            'id' => $payment->id,
            'provider' => $payment->provider,
            'payment_method' => $payment->payment_method,
            'amount' => (float) $payment->amount,
            'status' => $payment->status instanceof PaymentStatus ? $payment->status->value : (string) $payment->status,
            'payload' => $payment->payload,
            'reused' => $reused,
        ];
    }

    private function prismaLinkBackendCallbackUrl(): string
    {
        $configured = config('prismalink.backend_callback_url');

        if (is_string($configured) && $configured !== '') {
            return $configured;
        }

        return route('prismalink.backend-callback', absolute: true);
    }

    private function prismaLinkFrontendCallbackUrl(): string
    {
        $configured = config('prismalink.frontend_callback_url');

        if (is_string($configured) && $configured !== '') {
            return $configured;
        }

        return route('prismalink.frontend-callback', absolute: true);
    }

    private function prismaLinkPaymentMethodCode(?string $method): ?string
    {
        if ($method !== null && str_ends_with($method, '_va')) {
            return 'VA';
        }

        return match ($method) {
            'credit-card' => 'CC',
            'qr', 'qris' => 'QR',
            default => null,
        };
    }

    /**
     * @param  array<string, mixed>|null  $meta
     */
    private function prismaLinkBankIdFromMeta(?array $meta): ?string
    {
        $bankId = data_get($meta, 'bank_id');

        if (! is_string($bankId) && ! is_int($bankId)) {
            return null;
        }

        $bankId = trim((string) $bankId);

        return $bankId !== '' ? $bankId : null;
    }

    public function confirmOnlinePayment(Company $company, Booking $booking, Payment $payment): JsonResponse
    {
        $this->assertCompanyCanAccessBooking($company, $booking);
        abort_unless($payment->payable_type === Booking::class, 404);
        abort_unless((int) $payment->payable_id === (int) $booking->id, 404);

        if ($payment->provider === 'prismalink') {
            return $this->confirmPrismaLinkOnlinePayment($booking, $payment);
        }

        abort_unless($payment->provider === 'midtrans', 422);

        $orderId = data_get($payment->payload, 'order_id') ?? data_get($payment->payload, 'request.transaction_details.order_id');
        abort_unless(is_string($orderId) && $orderId !== '', 422);

        $transactionStatus = (array) Transaction::status($orderId);
        $newStatus = $this->mapMidtransStatus($transactionStatus['transaction_status'] ?? 'pending');

        if ($newStatus !== PaymentStatus::PAID) {
            $booking = $this->ensureBookingNotExpired($booking);
        }

        DB::transaction(function () use ($booking, $payment, $transactionStatus, $newStatus): void {
            $paymentWorkflow = app(BookingPaymentWorkflowService::class);

            if (
                $newStatus === PaymentStatus::PAID
                && ! $paymentWorkflow->isCustomerToAgentPayment($payment)
                && ! $paymentWorkflow->isAgentToVendorPayment($payment)
            ) {
                app(FinalizeBookingPaymentAction::class)
                    ->assertCanFinalizeIncomingPaidPayment($booking->fresh(), $payment->fresh());
            }

            $payment->update([
                'status' => $newStatus,
                'payload' => Payment::mergeMidtransPayload($payment->payload ?? [], $transactionStatus),
                'paid_at' => $newStatus === PaymentStatus::PAID ? now() : null,
            ]);

            if ($newStatus === PaymentStatus::PAID) {
                $freshPayment = $payment->fresh();

                if ($paymentWorkflow->isCustomerToAgentPayment($freshPayment)) {
                    $paymentWorkflow->markOnlineCustomerPaymentVerified($freshPayment);
                    $booking->fresh()->update([
                        'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
                        'reserved_expires_at' => null,
                    ]);
                } elseif ($paymentWorkflow->isAgentToVendorPayment($freshPayment)) {
                    $booking->fresh()->update([
                        'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
                        'reserved_expires_at' => null,
                    ]);
                } else {
                    app(FinalizeBookingPaymentAction::class)->execute($booking->fresh(), $freshPayment);
                }
            }

            app(NotifyBookingPaymentEventAction::class)->execute(
                $booking->fresh(),
                match ($newStatus) {
                    PaymentStatus::PAID => 'online_payment_confirmed',
                    PaymentStatus::FAILED => 'online_payment_failed',
                    default => 'online_payment_pending',
                },
                $payment->fresh()
            );
        });

        app(BookingContactPaymentEmailService::class)
            ->sendOnlinePaymentConfirmedIfEligible($booking->fresh(), $payment->fresh());

        return response()->json([
            'booking' => [
                'id' => $booking->id,
                'status' => $booking->fresh()->status->value,
            ],
            'payment' => [
                'id' => $payment->id,
                'status' => $payment->fresh()->status->value,
            ],
            'bookingPaymentResult' => $this->buildBookingPaymentResult($booking->fresh(), $payment->fresh()),
        ]);
    }

    private function confirmPrismaLinkOnlinePayment(Booking $booking, Payment $payment): JsonResponse
    {
        try {
            $result = app(PaymentGatewayStatusSyncService::class)->sync($payment);
        } catch (Throwable $exception) {
            Log::warning('PrismaLink dashboard booking payment status sync failed', [
                'booking_id' => $booking->id,
                'payment_id' => $payment->id,
                'message' => $exception->getMessage(),
            ]);

            return response()->json([
                'message' => 'Payment status could not be checked right now. Please try again shortly.',
            ], 422);
        }

        $freshPayment = $result['payment']->fresh();

        if ($freshPayment->status !== PaymentStatus::PAID) {
            $booking = $this->ensureBookingNotExpired($booking);
        }

        if ($freshPayment->status !== PaymentStatus::PAID) {
            app(NotifyBookingPaymentEventAction::class)->execute(
                $booking->fresh(),
                match ($freshPayment->status) {
                    PaymentStatus::FAILED => 'online_payment_failed',
                    default => 'online_payment_pending',
                },
                $freshPayment
            );
        }

        return response()->json([
            'booking' => [
                'id' => $booking->id,
                'status' => $booking->fresh()->status->value,
            ],
            'payment' => $this->onlinePaymentResponsePayload($freshPayment, false),
            'status' => $freshPayment->status->value,
            'transaction_status' => $result['transaction_status'],
            'bookingPaymentResult' => $this->buildBookingPaymentResult($booking->fresh(), $freshPayment),
        ]);
    }

    public function paymentResult(Company $company, Booking $booking): JsonResponse
    {
        $this->assertCompanyCanAccessBooking($company, $booking);

        return response()->json([
            'bookingPaymentResult' => $this->buildBookingPaymentResult($booking->fresh(), $booking->payments()->latest()->first()),
        ]);
    }

    private function assertCompanyCanBookTour(Company $company, Tour $tour): void
    {
        $companyType = $company->type->value ?? $company->type;

        if ($companyType === 'vendor') {
            abort_unless((int) $tour->company_id === (int) $company->id, 404);

            return;
        }

        abort_unless($companyType === 'agent', 404);
        abort_unless(AgentTour::query()
            ->where('company_id', $company->id)
            ->where('tour_id', $tour->id)
            ->where('status', 'active')
            ->exists(), 404);
    }

    private function assertCompanyCanAccessBooking(Company $company, Booking $booking): void
    {
        $companyType = $company->type->value ?? $company->type;

        $allowed = $companyType === 'vendor'
            ? (int) $booking->vendor_id === (int) $company->id
            : (int) $booking->agent_id === (int) $company->id;

        abort_unless($allowed, 404);
    }

    private function dashboardAgent(Company $company, Tour $tour): ?Company
    {
        return ($company->type->value ?? $company->type) === 'agent'
            && (int) $tour->company_id !== (int) $company->id
                ? $company
                : null;
    }

    private function resolveDashboardBookingAgent(Company $company, Tour $tour, mixed $agentId): ?Company
    {
        $companyType = $company->type->value ?? $company->type;

        if ($companyType === 'agent') {
            return $this->dashboardAgent($company, $tour);
        }

        if ($companyType !== 'vendor') {
            return null;
        }

        $normalizedAgentId = (int) $agentId;

        if ($normalizedAgentId <= 0) {
            throw ValidationException::withMessages([
                'agent_id' => 'Please select an agent for this booking.',
            ]);
        }

        $partnership = VendorAgentPartner::query()
            ->with('agent:id,name,username,email')
            ->where('vendor_id', $company->id)
            ->where('agent_id', $normalizedAgentId)
            ->where('status', VendorAgentPartnerStatus::ACTIVE->value)
            ->whereHas('agent.agentSubscription', fn (Builder $query): Builder => $this->eligibleAgentSubscriptionConstraint($query))
            ->first();

        if (! $partnership?->agent) {
            throw ValidationException::withMessages([
                'agent_id' => 'Please select an active agent partner for this booking.',
            ]);
        }

        if (! $this->agentHasActiveTourInCatalog($normalizedAgentId, $tour)) {
            throw ValidationException::withMessages([
                'agent_id' => 'Please select an agent who has saved this tour to their catalog.',
            ]);
        }

        return $partnership->agent;
    }

    private function agentHasActiveTourInCatalog(int $agentId, Tour $tour): bool
    {
        return AgentTour::query()
            ->where('company_id', $agentId)
            ->where('tour_id', $tour->id)
            ->where('status', 'active')
            ->exists();
    }

    private function resolveBookingOwner(Request $request, array $data): User
    {
        $email = trim((string) data_get($data, 'contact_email'));

        if ($email !== '') {
            $customer = User::query()->where('email', $email)->first();

            if ($customer) {
                return $customer;
            }
        }

        return $request->user();
    }

    private function resolveDashboardBookingNumber(mixed $bookingNumber, Company $company, BookingNumberService $bookingNumberService): string
    {
        $normalizedBookingNumber = trim((string) $bookingNumber);

        if ($normalizedBookingNumber !== '') {
            return $normalizedBookingNumber;
        }

        return $bookingNumberService->generate((string) $company->id);
    }

    private function assertDashboardBookingMatchesFlow(
        Booking $booking,
        Tour $tour,
        Company $company,
        string $departureDate
    ): void {
        $sameTour = (int) $booking->tour_id === (int) $tour->id;
        $sameVendor = (int) $booking->vendor_id === (int) $tour->company_id;
        $sameDepartureDate = $this->normalizeDateString($booking->departure_date)
            === $this->normalizeDateString($departureDate);

        if ($sameTour && $sameVendor && $sameDepartureDate) {
            return;
        }

        throw ValidationException::withMessages([
            'booking_number' => 'This booking reference is not valid for the selected tour and departure date.',
        ]);
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
     * @return array{user_name: string, company_name: string|null, role_label: string, created_at: string|null}
     */
    private function provisionalInputByPayload(?User $user, Company $company): array
    {
        $role = $this->currentCompanyRoleName($user, $company);

        return [
            'user_name' => $user?->name ?? 'Dashboard user',
            'company_name' => $company->name,
            'role_label' => $this->companyRoleLabel($role),
            'created_at' => now()->toJSON(),
        ];
    }

    private function currentCompanyRoleName(?User $user, Company $company): string
    {
        $companyType = (string) ($company->type->value ?? $company->type);

        if (! $user) {
            return $companyType;
        }

        $team = $company->teams()
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->first(['id', 'invite_role']);

        if (filled($team?->invite_role)) {
            return (string) $team->invite_role;
        }

        $roleName = $user->roles()
            ->where('name', 'like', "company:{$company->id}:%")
            ->value('name');

        if (filled($roleName)) {
            return (string) $roleName;
        }

        return $companyType;
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
     * @return Collection<int, array{id: int, company_id: int|null, name: string, email: string, phone: string|null}>
     */
    private function customerOptionsForDashboardBooking(Company $company): Collection
    {
        return User::query()
            ->whereIn('company_id', $this->dashboardCustomerCompanyIds($company))
            ->whereNotNull('email')
            ->orderBy('name')
            ->limit(50)
            ->get(['id', 'company_id', 'name', 'email', 'phone', 'note'])
            ->map(fn (User $user): array => [
                'id' => $user->id,
                'company_id' => $user->company_id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'note' => $user->note,
            ])
            ->values();
    }

    /**
     * @return Collection<int, int>
     */
    private function dashboardCustomerCompanyIds(Company $company): Collection
    {
        $companyType = $company->type->value ?? $company->type;

        if ($companyType !== 'vendor') {
            return collect([$company->id]);
        }

        return $company->agentPartners()
            ->where('status', VendorAgentPartnerStatus::ACTIVE->value)
            ->whereHas('agent.agentSubscription', fn (Builder $query): Builder => $this->eligibleAgentSubscriptionConstraint($query))
            ->pluck('agent_id');
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function savedPassengerOptionsForDashboardBooking(Company $company, mixed $departureDate): array
    {
        return User::query()
            ->whereIn('company_id', $this->dashboardCustomerCompanyIds($company))
            ->whereHas('savedPassengers')
            ->with(['savedPassengers' => fn ($query) => $query->latest('updated_at')])
            ->orderBy('name')
            ->limit(50)
            ->get(['id', 'company_id', 'name', 'note'])
            ->flatMap(function (User $user) use ($departureDate): Collection {
                return $user->savedPassengers->map(fn ($passenger): array => [
                    'id' => $passenger->id,
                    'ownerUserId' => $user->id,
                    'ownerCompanyId' => $user->company_id,
                    'customerNote' => $user->note,
                    'title' => $passenger->title,
                    'firstName' => $passenger->first_name,
                    'lastName' => $passenger->last_name,
                    'dateOfBirth' => $passenger->dob?->toDateString(),
                    'travelerType' => $this->resolveSavedPassengerTravelerType(
                        $passenger->dob?->toDateString(),
                        $departureDate,
                    ),
                    'placeOfBirth' => $passenger->pob,
                    'passportNumber' => $passenger->passport_number,
                    'passportIssueDate' => $passenger->passport_issue_date?->toDateString(),
                    'passportExpiryDate' => $passenger->passport_expiry_date?->toDateString(),
                    'visaNumber' => $passenger->visa_number,
                    'passportFilePath' => $passenger->passport_file_path,
                    'passportFileName' => app(BookingTravelDocumentService::class)->fileNameFromPath($passenger->passport_file_path),
                    'visaFilePath' => $passenger->visa_file_path,
                    'visaFileName' => app(BookingTravelDocumentService::class)->fileNameFromPath($passenger->visa_file_path),
                ]);
            })
            ->sortByDesc(fn (array $passenger): int => (int) $passenger['id'])
            ->values()
            ->all();
    }

    private function resolveSavedPassengerTravelerType(?string $dateOfBirth, mixed $departureDate): ?string
    {
        if (! $dateOfBirth || ! $departureDate) {
            return null;
        }

        try {
            $dob = Carbon::parse($dateOfBirth);
            $departure = Carbon::parse($departureDate);
        } catch (Throwable) {
            return null;
        }

        if ($dob->greaterThan($departure)) {
            return null;
        }

        $age = (int) $dob->diffInYears($departure);

        if ($age < 2) {
            return 'infant';
        }

        if ($age < 12) {
            return 'child';
        }

        return 'adult';
    }

    /**
     * @return Collection<int, array{id: int, name: string, username: string, email: string|null}>
     */
    private function agentOptionsForDashboardBooking(Company $company, Tour $tour): Collection
    {
        if (($company->type->value ?? $company->type) !== 'vendor') {
            return collect();
        }

        $catalogedAgentIds = AgentTour::query()
            ->where('tour_id', $tour->id)
            ->where('status', 'active')
            ->pluck('company_id');

        return $company->agentPartners()
            ->with('agent:id,name,username,email')
            ->where('status', VendorAgentPartnerStatus::ACTIVE->value)
            ->whereIn('agent_id', $catalogedAgentIds)
            ->whereHas('agent.agentSubscription', fn (Builder $query): Builder => $this->eligibleAgentSubscriptionConstraint($query))
            ->get()
            ->map(fn (VendorAgentPartner $partner): ?array => $partner->agent ? [
                'id' => $partner->agent->id,
                'name' => $partner->agent->name,
                'username' => $partner->agent->username,
                'email' => $partner->agent->email,
            ] : null)
            ->filter()
            ->values();
    }

    private function eligibleAgentSubscriptionConstraint(Builder $query): Builder
    {
        return $query->whereNotNull('package_id');
    }

    private function transferDashboardPlaceholderOwnership(string $bookingNumber, ?User $dashboardUser, User $owner): void
    {
        if (! $dashboardUser || (int) $dashboardUser->id === (int) $owner->id) {
            return;
        }

        Booking::query()
            ->where('booking_number', $bookingNumber)
            ->where('user_id', $dashboardUser->id)
            ->whereIn('status', [
                BookingStatus::AWAITING_PAYMENT,
                BookingStatus::BOOKING_RESERVED,
            ])
            ->update(['user_id' => $owner->id]);
    }

    private function tourPricesForSchedule(Tour $tour, ?TourSchedule $schedule, Collection $agentOptions, ?int $selectedAgentId = null): Collection
    {
        $agentIds = $agentOptions
            ->pluck('id')
            ->when($selectedAgentId !== null, fn (Collection $ids): Collection => $ids->push($selectedAgentId))
            ->filter()
            ->map(fn (mixed $id): int => (int) $id)
            ->unique()
            ->values();

        return TourPrice::query()
            ->with('priceCategory:id,name,description')
            ->where('tour_code', $tour->code)
            ->when($schedule, fn ($query) => $query->where('schedule_id', $schedule->id))
            ->orderBy('id')
            ->get()
            ->unique('price_category_id')
            ->map(function (TourPrice $price) use ($tour, $schedule, $agentIds, $selectedAgentId): array {
                $agentCommissions = $this->agentCommissionsForPrice($tour, $schedule, $price, $agentIds);

                return [
                    'tourPriceId' => $price->id,
                    'categoryName' => $price->priceCategory?->name ?? 'Single',
                    'description' => $price->priceCategory?->description ?? '',
                    'price' => (float) $price->price,
                    'promotionRate' => (float) $price->promotion_rate,
                    'promotion' => (float) $price->promotion,
                    'commissionRate' => (float) $price->commission_rate,
                    'commission' => (float) $price->commission,
                    'effectiveCommission' => $selectedAgentId ? ($agentCommissions[(string) $selectedAgentId] ?? null) : null,
                    'agentCommissionsByAgentId' => $agentCommissions,
                ];
            })
            ->values();
    }

    /**
     * @param  Collection<int, int>  $agentIds
     * @return array<string, float>
     */
    private function agentCommissionsForPrice(Tour $tour, ?TourSchedule $schedule, TourPrice $price, Collection $agentIds): array
    {
        $basePrice = $this->discountedTourPrice($price);

        return $agentIds
            ->mapWithKeys(fn (int $agentId): array => [
                (string) $agentId => (float) app(AgentCommissionResolver::class)
                    ->resolve($tour, $schedule, $price, $basePrice, $agentId)['amount'],
            ])
            ->all();
    }

    private function discountedTourPrice(TourPrice $price): float
    {
        $basePrice = (float) $price->price;
        $promotionRate = (float) ($price->promotion_rate ?? 0);
        $promotion = (float) ($price->promotion ?? 0);

        if ($promotionRate > 0) {
            return max(0.0, (float) round($basePrice - (($basePrice * $promotionRate) / 100)));
        }

        if ($promotion > 0) {
            return max(0.0, (float) round($basePrice - $promotion));
        }

        return $basePrice;
    }

    private function resolveBookableSchedule(Tour $tour, string $departureDate, ?int $companyId = null): ?TourSchedule
    {
        if (! $this->isDepartureDateInsideBookingWindow($tour, $departureDate)) {
            return null;
        }

        return $this->resolveActiveSchedule($tour, $departureDate, $companyId);
    }

    private function resolveActiveSchedule(Tour $tour, string $departureDate, ?int $companyId = null): ?TourSchedule
    {
        return TourSchedule::query()
            ->where('tour_id', $tour->id)
            ->where('company_id', $companyId ?? $tour->company_id)
            ->where('is_active', true)
            ->whereDate('departure_date', Carbon::parse($departureDate)->toDateString())
            ->first();
    }

    private function isDepartureDateInsideBookingWindow(Tour $tour, string $departureDate): bool
    {
        $tour->loadMissing('company.companySetting');

        $parsedDepartureDate = Carbon::parse($departureDate)->startOfDay();
        $deadlineDays = (int) ($tour->company?->companySetting?->booking_deadline ?? 0);
        $cutoffDate = now()->startOfDay()->addDays($deadlineDays);

        return $parsedDepartureDate->gte($cutoffDate);
    }

    private function assertPaymentTypeAllowedForTour(Tour $tour, string $paymentType): void
    {
        app(BookingDownPaymentRuleService::class)->assertPaymentTypeAvailableForTour($tour, $paymentType);
    }

    private function assertPaymentTypeAllowedForBooking(Booking $booking, string $paymentType): void
    {
        app(BookingDownPaymentRuleService::class)->assertPaymentTypeAvailableForBooking($booking, $paymentType);
    }

    private function assertDashboardCanStartPayment(Booking $booking, float $incomingAmount, string $paymentType): void
    {
        $this->assertPaymentTypeAllowedForBooking($booking, $paymentType);
        app(BookingDownPaymentRuleService::class)->assertIncomingDownPaymentAmount($booking, $incomingAmount, $paymentType);
        $this->assertFullPaymentCoversRemainingBalance($booking, $incomingAmount, $paymentType);

        try {
            app(FinalizeBookingPaymentAction::class)->assertCanFinalizeIncomingAmount(
                $booking->fresh(),
                $incomingAmount,
                seatContext: BookingAvailabilityContext::Payment,
            );
        } catch (ValidationException $exception) {
            $paymentMessage = $exception->errors()['payment'][0] ?? null;

            if ($paymentMessage !== null) {
                throw $exception;
            }

            throw ValidationException::withMessages(['payment' => self::PAYMENT_UNAVAILABLE_MESSAGE]);
        }
    }

    private function assertFullPaymentCoversRemainingBalance(Booking $booking, float $incomingAmount, string $paymentType): void
    {
        if ($paymentType !== 'full_payment') {
            return;
        }

        $freshBooking = $booking->fresh();
        $paidAmount = app(BookingPaymentWorkflowService::class)->finalizablePaidAmount($freshBooking);
        $remainingBalance = app(BookingReschedulePayment::class)->remainingBalance($freshBooking, $paidAmount);

        if ($incomingAmount + 0.01 >= $remainingBalance) {
            return;
        }

        throw ValidationException::withMessages([
            'payment' => 'Full payment must cover the remaining booking balance.',
        ]);
    }

    private function pendingOnlinePaymentBookingStatus(Booking $booking): BookingStatus
    {
        if ($booking->status === BookingStatus::DOWN_PAYMENT) {
            return BookingStatus::DOWN_PAYMENT;
        }

        if (
            $booking->status === BookingStatus::WAITING_PAYMENT_APPROVAL
            && $booking->reserved_type === 'payment_in_progress'
        ) {
            return BookingStatus::WAITING_PAYMENT_APPROVAL;
        }

        return BookingStatus::BOOKING_RESERVED;
    }

    private function fullPaymentAvailabilityForBooking(?Booking $booking, float $incomingAmount): array
    {
        if (! $booking || $incomingAmount <= 0 || (float) $booking->grand_total <= 0 || ! $booking->passengers()->exists()) {
            return [true, null];
        }

        try {
            app(FinalizeBookingPaymentAction::class)->assertCanFinalizeIncomingAmount(
                $booking->fresh(),
                $incomingAmount,
                seatContext: BookingAvailabilityContext::Payment,
            );

            return [true, null];
        } catch (ValidationException $exception) {
            $paymentMessage = $exception->errors()['payment'][0] ?? null;

            return [false, $paymentMessage ?? self::PAYMENT_UNAVAILABLE_MESSAGE];
        }
    }

    private function resolveBookingTimeLimitMinutes(Tour $tour): int
    {
        $tour->loadMissing('company.companySetting');

        $minutes = (int) ($tour->company?->companySetting?->booking_entry_time_limit ?? 0);

        return $minutes > 0 ? $minutes : 10;
    }

    private function remainingHoldSeconds(?Booking $booking): ?int
    {
        if (! $booking || $booking->status !== BookingStatus::BOOKING_RESERVED || ! $booking->reserved_expires_at) {
            return null;
        }

        return max(0, (int) now()->diffInSeconds($booking->reserved_expires_at, false));
    }

    private function normalizeDateString(\DateTimeInterface|string|null $date): ?string
    {
        if ($date === null) {
            return null;
        }

        if ($date instanceof \DateTimeInterface) {
            return $date->format('Y-m-d');
        }

        return Carbon::parse($date)->toDateString();
    }

    private function heldSeatCountForBooking(?Booking $booking, ?int $tourId = null, ?string $departureDate = null, ?int $vendorId = null): int
    {
        if (! $booking) {
            return 0;
        }

        if ($tourId !== null && (int) $booking->tour_id !== $tourId) {
            return 0;
        }

        if ($vendorId !== null && (int) $booking->vendor_id !== $vendorId) {
            return 0;
        }

        if ($departureDate !== null && $this->normalizeDateString($booking->departure_date) !== $departureDate) {
            return 0;
        }

        $status = $booking->status instanceof BookingStatus
            ? $booking->status
            : BookingStatus::tryFrom((string) $booking->status);

        if (! $status?->reducesAvailability()) {
            return 0;
        }

        return max(0, $booking->seatTakingPaxCount());
    }

    private function bookingNeedsTravelDocuments(Booking $booking): bool
    {
        return app(BookingTravelDocumentService::class)->bookingNeedsTravelDocuments($booking);
    }

    private function ensureBookingNotExpired(Booking $booking): Booking
    {
        $booking = app(ExpireBookingReservationsAction::class)->expireIfDue($booking);

        if ($booking->status === BookingStatus::EXPIRED) {
            throw ValidationException::withMessages([
                'booking' => 'This booking reservation has expired. Please start a new booking.',
            ]);
        }

        return $booking;
    }

    private function mapMidtransStatus(mixed $midtransStatus): PaymentStatus
    {
        return match ($midtransStatus) {
            'capture', 'settlement' => PaymentStatus::PAID,
            'pending' => PaymentStatus::PENDING,
            'deny', 'cancel', 'expire' => PaymentStatus::FAILED,
            default => PaymentStatus::PENDING,
        };
    }

    private function midtransEnvironment(): string
    {
        return (bool) config('midtrans.is_production') ? 'production' : 'sandbox';
    }

    private function buildBookingPaymentResult(Booking $booking, ?Payment $payment = null): array
    {
        $booking->loadMissing(['tour.image', 'payments']);

        $paidAmount = app(BookingPaymentWorkflowService::class)->finalizablePaidAmount($booking);
        $reschedulePayment = app(BookingReschedulePayment::class);
        $grandTotal = $reschedulePayment->effectiveGrandTotalForPayment($booking, $paidAmount);
        $latestPayment = $payment ?? $booking->payments()->latest()->first();
        $schedule = $this->resolvePaymentResultSchedule($booking);

        return [
            'bookingId' => $booking->id,
            'bookingNumber' => $booking->booking_number,
            'bookingStatus' => $booking->status->value,
            'paymentStatus' => $latestPayment?->status instanceof PaymentStatus
                ? $latestPayment->status->value
                : (string) ($latestPayment?->status ?? ''),
            'paymentMode' => $booking->payment_mode,
            'tourName' => $booking->tour?->name ?? 'Selected tour',
            'tourCode' => $booking->tour?->code,
            'destination' => $booking->tour?->destination,
            'departureDate' => $booking->departure_date?->toDateString(),
            'returnDate' => $schedule?->return_date,
            'paxSummary' => $this->buildPaxSummary($booking),
            'grandTotal' => $grandTotal,
            'paidAmount' => $paidAmount,
            'remainingBalance' => $reschedulePayment->remainingBalance($booking, $paidAmount),
            'image' => $booking->tour?->image?->toArray(),
        ];
    }

    private function resolvePaymentResultSchedule(Booking $booking): ?TourSchedule
    {
        if (! $booking->tour || ! $booking->departure_date) {
            return null;
        }

        return TourSchedule::query()
            ->where('tour_id', $booking->tour_id)
            ->whereDate('departure_date', $booking->departure_date)
            ->first();
    }

    private function buildPaxSummary(Booking $booking): string
    {
        $segments = [];

        if ((int) $booking->pax_adult > 0) {
            $segments[] = $booking->pax_adult.' adult'.((int) $booking->pax_adult === 1 ? '' : 's');
        }

        if ((int) $booking->pax_child > 0) {
            $segments[] = $booking->pax_child.' child'.((int) $booking->pax_child === 1 ? '' : 'ren');
        }

        if ((int) $booking->pax_infant > 0) {
            $segments[] = $booking->pax_infant.' infant'.((int) $booking->pax_infant === 1 ? '' : 's');
        }

        return implode(', ', $segments) ?: 'No guests';
    }
}
