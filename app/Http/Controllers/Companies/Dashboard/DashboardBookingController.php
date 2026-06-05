<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Actions\Booking\ExpireBookingReservationsAction;
use App\Actions\Booking\FinalizeBookingPaymentAction;
use App\Actions\Booking\NotifyBookingPaymentEventAction;
use App\Actions\Booking\SyncAvailabilityAction;
use App\Enums\BookingStatus;
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
use App\Models\Role;
use App\Models\Tour;
use App\Models\TourAddOn;
use App\Models\TourAvailability;
use App\Models\TourPrice;
use App\Models\TourSchedule;
use App\Models\User;
use App\Models\VendorAgentPartner;
use App\Services\BookingDownPaymentRuleService;
use App\Services\BookingNumberService;
use App\Services\BookingPaymentReceiverService;
use App\Services\BookingPaymentWorkflowService;
use App\Services\BookingPricingService;
use App\Services\BookingRoomArrangementValidator;
use App\Services\BookingService;
use App\Services\BookingTravelDocumentService;
use App\Services\ReusableMidtransBookingPaymentAttemptService;
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
use Midtrans\Snap;
use Midtrans\Transaction;
use Throwable;

class DashboardBookingController extends Controller
{
    private const PAYMENT_UNAVAILABLE_MESSAGE = 'Payment is temporarily unavailable. Please try again later or contact customer support.';

    private const ONLINE_PAYMENT_UNAVAILABLE_MESSAGE = 'Online payment is temporarily unavailable. Please try again later or contact customer support.';

    /**
     * @var array<string, string>
     */
    private array $roleLabelCache = [];

    public function create(Company $company, Tour $tour): Response
    {
        $this->assertCompanyCanBookTour($company, $tour);

        $tour->load('company.companySetting', 'schedules.availability');
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

            $addOns = TourAddOn::query()
                ->where('schedule_id', $schedule->id)
                ->where('tour_id', $tour->id)
                ->get()
                ->map(fn (TourAddOn $addon): array => [
                    'key' => 'addon_'.$addon->id,
                    'label' => $addon->description,
                    'unitPrice' => (float) $addon->price,
                    'qty' => $addon->edit_status ? 0 : 1,
                    'hasQty' => (bool) $addon->edit_status,
                    'isTaxable' => (bool) $addon->is_taxable,
                ])
                ->values()
                ->toArray();
        }

        $requestedBookingNumber = request()->string('booking_number')->trim()->toString();
        $bookingNumber = null;
        $dashboardUser = request()->user();
        $agent = $this->dashboardAgent($company, $tour);
        $agentOptions = $this->agentOptionsForDashboardBooking($company);
        $existingBooking = null;

        if ($dashboardUser && $schedule && $isScheduleBookable && $requestedBookingNumber !== '') {
            $existingBooking = Booking::query()
                ->where('booking_number', $requestedBookingNumber)
                ->where('tour_id', $tour->id)
                ->whereDate('departure_date', $requestedDepartureDate)
                ->first();

            if ($existingBooking) {
                $bookingNumber = $existingBooking->booking_number;
                $existingBooking->load([
                    'inputByCompany:id,name,type',
                    'inputByUser:id,name',
                    'passengers',
                    'rooms',
                    'user:id,name',
                ]);
            }
        }

        if (($company->type->value ?? $company->type) === 'vendor' && $existingBooking?->agent_id) {
            $agent = Company::query()
                ->whereKey($existingBooking->agent_id)
                ->where('type', 'agent')
                ->first();
        }

        $paidAmount = $existingBooking
            ? app(BookingPaymentWorkflowService::class)->finalizablePaidAmount($existingBooking)
            : 0.0;
        $remainingBalance = $existingBooking
            ? max(0.0, (float) $existingBooking->grand_total - $paidAmount)
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
            'tourPrices' => $this->tourPricesForSchedule($tour, $schedule),
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
            'bookingDeadlineDays' => $deadlineDays,
            'bookingTimeLimitMinutes' => $bookingTimeLimitMinutes,
            'downPaymentAvailable' => $downPaymentAvailable,
            'minimumDownPaymentPct' => $minimumDownPaymentPct,
            'downPaymentRule' => $downPaymentRule,
            'minimumVatPct' => (float) ($settings?->minimum_vat ?? BookingPricingService::DEFAULT_PPN_RATE),
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
            'passengers' => ['required', 'array', 'min:1'],
            'passengers.*.title' => ['nullable', 'string', 'max:20'],
            'passengers.*.first_name' => ['required', 'string', 'max:255'],
            'passengers.*.last_name' => ['nullable', 'string', 'max:255'],
            'passengers.*.dob' => ['nullable', 'date'],
            'passengers.*.pob' => ['nullable', 'string', 'max:255'],
            'passengers.*.price_category' => ['nullable', 'string'],
            'passengers.*.price_amount' => ['nullable', 'numeric'],
            'passengers.*.room_type' => ['nullable', 'string'],
            'passengers.*.note' => ['nullable', 'string', 'max:1000'],
        ]);

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
                ->where('user_id', $owner->id)
                ->lockForUpdate()
                ->first();

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

            $bookingSeatLimit = ($availability ? (int) $availability->available : 0)
                + $this->heldSeatCountForBooking($existingBooking, $tour->id, $this->normalizeDateString($schedule->departure_date), $tour->company_id);
            $requestedSeatCount = (int) $data['pax_adult'] + (int) $data['pax_child'] + (int) $data['pax_infant'];

            if ($requestedSeatCount > $bookingSeatLimit) {
                throw ValidationException::withMessages([
                    'availability' => "This booking can include up to {$bookingSeatLimit} guests for this schedule.",
                ]);
            }

            $quote = app(BookingPricingService::class)->quoteForBookingData(
                $tour,
                (string) $data['departure_date'],
                $data['passengers'],
                [],
                (float) ($tour->company?->companySetting?->minimum_vat ?? BookingPricingService::DEFAULT_PPN_RATE),
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
                    'user_id' => $owner->id,
                ],
                [
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

            return $booking;
        });

        app(SyncAvailabilityAction::class)->executeForBooking($booking->fresh());

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

        $validated['booking_number'] = $this->resolveDashboardBookingNumber(data_get($validated, 'booking_number'), $company, $bookingNumberService);
        $this->transferDashboardPlaceholderOwnership((string) $validated['booking_number'], $request->user(), $owner);

        $validated['vendor_id'] = $tour->company_id;
        $validated['agent_id'] = $agent?->id;
        $validated['tour_id'] = $tour->id;
        $validated['input_by_user_id'] = $request->user()->id;
        $validated['input_by_company_id'] = $company->id;
        $validated['input_by_role'] = $this->currentCompanyRoleName($request->user(), $company);

        $bookingService->createBooking($validated, $owner);

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

    public function updateTravelDocuments(Company $company, Booking $booking, Request $request): RedirectResponse
    {
        $this->assertCompanyCanAccessBooking($company, $booking);
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
                } elseif (array_key_exists('passport_file_path', $passengerData)) {
                    $update['passport_file_path'] = $passengerData['passport_file_path'];
                }

                if ($request->hasFile("passengers.{$index}.visa_file")) {
                    $update['visa_file_path'] = $request->file("passengers.{$index}.visa_file")->store('travel-documents/visas', 'public');
                } elseif (array_key_exists('visa_file_path', $passengerData)) {
                    $update['visa_file_path'] = $passengerData['visa_file_path'];
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

            $booking->update([
                'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
                'payment_mode' => 'manual',
                'reserved_expires_at' => null,
            ]);

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
        ]);

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
        $reusableAttemptService = app(ReusableMidtransBookingPaymentAttemptService::class);
        $reusablePayment = $reusableAttemptService->findReusableAttempt(
            $booking,
            get_class($request->user()),
            $request->user()->id,
            (string) $validated['payment_type'],
            (float) $validated['amount'],
            $paymentWorkflowPayload,
        );

        if ($reusablePayment) {
            $booking->update([
                'status' => $agentVendorCustomerPayment
                    ? BookingStatus::WAITING_PAYMENT_APPROVAL
                    : $this->pendingOnlinePaymentBookingStatus($booking),
                'payment_mode' => 'online',
            ]);

            return response()->json([
                'payment' => [
                    'id' => $reusablePayment->id,
                    'payload' => $reusablePayment->payload,
                    'reused' => true,
                ],
                'bookingPaymentResult' => $this->buildBookingPaymentResult($booking->fresh(), $reusablePayment->fresh()),
            ]);
        }

        $payment = DB::transaction(function () use ($request, $booking, $validated, $agentVendorCustomerPayment, $paymentWorkflowPayload, $reusableAttemptService): Payment {
            $payment = $booking->payments()->create([
                'owner_type' => get_class($request->user()),
                'owner_id' => $request->user()->id,
                'provider' => 'midtrans',
                'payment_method' => 'snap',
                'amount' => $validated['amount'],
                'status' => 'unpaid',
                'payload' => $paymentWorkflowPayload,
            ]);

            $params = [
                'transaction_details' => [
                    'order_id' => $payment->id.'-'.uniqid(),
                    'gross_amount' => (int) $payment->amount,
                ],
                'customer_details' => [
                    'first_name' => $booking->contact_name ?: $request->user()->name,
                    'email' => $booking->contact_email ?: $request->user()->email,
                ],
                'callbacks' => [
                    'finish' => route('companies.dashboard.bookings.index', request()->route('company'), false),
                ],
                'expiry' => $reusableAttemptService->snapExpiryPayload(),
            ];
            $orderId = $params['transaction_details']['order_id'];
            $snapTokenExpiresAt = $reusableAttemptService->newSnapTokenExpiresAt();

            try {
                $snapToken = Snap::getSnapToken($params);
            } catch (Throwable $exception) {
                Log::warning('Midtrans Snap token request failed', [
                    'booking_id' => $booking->id,
                    'payment_id' => $payment->id,
                    'payment_type' => $validated['payment_type'],
                    'amount' => (float) $payment->amount,
                    'midtrans_environment' => $this->midtransEnvironment(),
                    'message' => $exception->getMessage(),
                ]);

                throw ValidationException::withMessages(['payment' => self::ONLINE_PAYMENT_UNAVAILABLE_MESSAGE]);
            }

            if (! $snapToken) {
                throw ValidationException::withMessages(['payment' => self::ONLINE_PAYMENT_UNAVAILABLE_MESSAGE]);
            }

            $payment->update([
                'status' => 'pending',
                'payload' => [
                    ...$paymentWorkflowPayload,
                    'order_id' => $orderId,
                    'snap_token' => $snapToken,
                    'snap_token_expires_at' => $snapTokenExpiresAt->toISOString(),
                    'request' => $params,
                ],
                'expired_at' => $snapTokenExpiresAt,
            ]);

            $booking->update([
                'status' => $agentVendorCustomerPayment
                    ? BookingStatus::WAITING_PAYMENT_APPROVAL
                    : $this->pendingOnlinePaymentBookingStatus($booking),
                'payment_mode' => 'online',
            ]);

            return $payment;
        });

        app(SyncAvailabilityAction::class)->executeForBooking($booking->fresh());
        app(NotifyBookingPaymentEventAction::class)->execute($booking->fresh(), 'online_payment_pending', $payment->fresh());

        return response()->json([
            'payment' => [
                'id' => $payment->id,
                'payload' => $payment->payload,
                'reused' => false,
            ],
            'bookingPaymentResult' => $this->buildBookingPaymentResult($booking->fresh(), $payment->fresh()),
        ]);
    }

    public function confirmOnlinePayment(Company $company, Booking $booking, Payment $payment): JsonResponse
    {
        $this->assertCompanyCanAccessBooking($company, $booking);
        abort_unless($payment->payable_type === Booking::class, 404);
        abort_unless((int) $payment->payable_id === (int) $booking->id, 404);
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

        return $partnership->agent;
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
    private function agentOptionsForDashboardBooking(Company $company): Collection
    {
        if (($company->type->value ?? $company->type) !== 'vendor') {
            return collect();
        }

        return $company->agentPartners()
            ->with('agent:id,name,username,email')
            ->where('status', VendorAgentPartnerStatus::ACTIVE->value)
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
        return $query
            ->whereNotNull('package_id')
            ->where('package_id', '!=', 1);
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

    private function tourPricesForSchedule(Tour $tour, ?TourSchedule $schedule): Collection
    {
        return TourPrice::query()
            ->with('priceCategory:id,name,description')
            ->where('tour_code', $tour->code)
            ->when($schedule, fn ($query) => $query->where('schedule_id', $schedule->id))
            ->orderBy('id')
            ->get()
            ->unique('price_category_id')
            ->map(fn (TourPrice $price): array => [
                'tourPriceId' => $price->id,
                'categoryName' => $price->priceCategory?->name ?? 'Single',
                'description' => $price->priceCategory?->description ?? '',
                'price' => (float) $price->price,
                'promotionRate' => (float) $price->promotion_rate,
                'promotion' => (float) $price->promotion,
                'commissionRate' => (float) $price->commission_rate,
                'commission' => (float) $price->commission,
            ])
            ->values();
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
            app(FinalizeBookingPaymentAction::class)->assertCanFinalizeIncomingAmount($booking->fresh(), $incomingAmount);
        } catch (ValidationException) {
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
        $remainingBalance = max(0.0, (float) $freshBooking->grand_total - $paidAmount);

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
            app(FinalizeBookingPaymentAction::class)->assertCanFinalizeIncomingAmount($booking->fresh(), $incomingAmount);

            return [true, null];
        } catch (ValidationException) {
            return [false, self::PAYMENT_UNAVAILABLE_MESSAGE];
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

        return max(0, (int) $booking->pax_adult + (int) $booking->pax_child + (int) $booking->pax_infant);
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
        $grandTotal = (float) $booking->grand_total;
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
            'remainingBalance' => max(0.0, $grandTotal - $paidAmount),
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
