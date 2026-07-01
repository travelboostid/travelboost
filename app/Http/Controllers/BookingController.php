<?php

namespace App\Http\Controllers;

use App\Actions\Booking\AssertBookingOnlinePaymentStartAllowedAction;
use App\Actions\Booking\ExpireBookingReservationsAction;
use App\Actions\Booking\FinalizeBookingPaymentAction;
use App\Actions\Booking\NotifyBookingPaymentEventAction;
use App\Actions\Booking\ReconcileBookingPaymentAfterRepriceAction;
use App\Actions\Booking\ReleaseCustomerBookingHoldAction;
use App\Actions\Booking\ReorderCustomerBookingAction;
use App\Actions\Booking\ReserveCustomerBookingAction;
use App\Actions\Booking\SyncAvailabilityAction;
use App\Enums\BookingAvailabilityContext;
use App\Enums\BookingStatus;
use App\Enums\PaymentMethodStatus;
use App\Enums\PaymentMethodUsageScope;
use App\Enums\PaymentStatus;
use App\Enums\TourWaitingListScheduleStatus;
use App\Http\Requests\StoreBookingRequest;
use App\Http\Requests\UpdateBookingRequest;
use App\Models\Booking;
use App\Models\BookingDocument;
use App\Models\Company;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\Tour;
use App\Models\TourAvailability;
use App\Models\TourPrice;
use App\Models\TourSchedule;
use App\Models\TourWaitingListSchedule;
use App\Models\User;
use App\Services\AgentCommissionResolver;
use App\Services\BookingAddOnOptionsService;
use App\Services\BookingContactPaymentEmailService;
use App\Services\BookingDownPaymentRuleService;
use App\Services\BookingNumberService;
use App\Services\BookingPaymentReceiverService;
use App\Services\BookingPaymentWorkflowService;
use App\Services\BookingPricingService;
use App\Services\BookingService;
use App\Services\MidtransService;
use App\Services\PaymentGatewayStatusSyncService;
use App\Services\PrismaLinkException;
use App\Services\PrismaLinkService;
use App\Services\ReusablePrismaLinkBookingPaymentAttemptService;
use App\Support\BookingReschedulePayment;
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

class BookingController extends Controller
{
    public function __construct(
        private readonly MidtransService $midtransService,
    ) {}

    private const CUSTOMER_PAYMENT_UNAVAILABLE_MESSAGE = 'Payment is temporarily unavailable. Please try again later or contact customer support.';

    private const ONLINE_PAYMENT_UNAVAILABLE_MESSAGE = 'Online payment is temporarily unavailable. Please try again later or contact customer support.';

    /**
     * Show the form for creating a new booking.
     */
    public function create(string $username, Tour $tour, BookingNumberService $bookingNumberService): Response
    {
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

        $tenant = request()->attributes->get('tenant');
        $companyId = $tenant?->id ?? 0;
        $agentCode = $tenant?->username ?? 'AGT';
        $tourCode = $tour->code ?? 'TOUR';

        $schedule = null;
        $availableSeats = 0;
        $isScheduleBookable = false;
        if (request()->query('date')) {
            $requestedDepartureDate = request()->string('date')->toString();
            $schedule = $this->resolveActiveSchedule($tour, $requestedDepartureDate);
            $isScheduleBookable = $schedule !== null
                && $this->isDepartureDateInsideBookingWindow($tour, $requestedDepartureDate);

            if ($schedule) {
                app(ExpireBookingReservationsAction::class)->execute($tour->company, $tour->id);

                $availability = TourAvailability::where('schedule_id', $schedule->id)
                    ->where('tour_id', $tour->id)
                    ->first();

                $availableSeats = $isScheduleBookable && $availability ? (int) $availability->available : 0;

                $addOns = $this->buildAddOnOptions($tour, $schedule);
            } else {
                $addOns = [];
            }
        } else {
            $addOns = [];
        }

        $bookingNumber = $bookingNumberService->generate((string) $companyId);
        $user = request()->user();
        $paymentReceiver = app(BookingPaymentReceiverService::class)
            ->resolveForTourAndTenant($tour, $tenant);
        $paymentReceiverSettings = $paymentReceiver['settings'];
        $paymentReceiverPartnership = $paymentReceiver['partnership'];
        $existingBooking = null;
        $bookingConflict = null;
        $isResumingExistingBooking = false;
        $requestedBookingNumber = request()->string('booking_number')->toString();
        $forceNewBooking = request()->boolean('force_new');
        $waitingListScheduleId = request()->integer('waiting_list_schedule_id');
        $isWaitingListBooking = false;

        if ($user && $waitingListScheduleId > 0 && $requestedBookingNumber === '') {
            $waitingListSchedule = TourWaitingListSchedule::query()
                ->with(['waitingList', 'booking.passengers', 'booking.rooms', 'booking.addons', 'tourSchedule'])
                ->whereKey($waitingListScheduleId)
                ->where('status', TourWaitingListScheduleStatus::OFFERED)
                ->whereHas('waitingList', function ($query) use ($user, $tour): void {
                    $query
                        ->where('customer_user_id', $user->id)
                        ->where('tour_id', $tour->id);
                })
                ->first();

            if ($waitingListSchedule?->booking) {
                $existingBooking = $waitingListSchedule->booking;
                $isResumingExistingBooking = true;
                $isWaitingListBooking = true;
                $schedule = $waitingListSchedule->tourSchedule ?? $schedule;
                $requestedBookingNumber = $existingBooking->booking_number;

                if ($schedule) {
                    $requestedDepartureDate = $schedule->departure_date instanceof \DateTimeInterface
                        ? $schedule->departure_date->format('Y-m-d')
                        : (string) $schedule->departure_date;
                    $isScheduleBookable = $this->isDepartureDateInsideBookingWindow($tour, $requestedDepartureDate);

                    $availability = TourAvailability::where('schedule_id', $schedule->id)
                        ->where('tour_id', $tour->id)
                        ->first();
                    $availableSeats = $isScheduleBookable && $availability
                        ? (int) $availability->available
                        : 0;
                    $addOns = $this->buildAddOnOptions($tour, $schedule);
                }
            }
        }

        if ($user && $schedule) {
            $draftStatuses = [
                BookingStatus::AWAITING_PAYMENT,
                BookingStatus::BOOKING_RESERVED,
                BookingStatus::RESERVED,
            ];
            $resumableStatuses = [
                BookingStatus::AWAITING_PAYMENT,
                BookingStatus::BOOKING_RESERVED,
                BookingStatus::WAITING_PAYMENT_APPROVAL,
                BookingStatus::DOWN_PAYMENT,
                BookingStatus::RESERVED,
            ];

            if ($requestedBookingNumber !== '' && ! $existingBooking) {
                $requestedBookingStatuses = $isScheduleBookable
                    ? [
                        ...$resumableStatuses,
                        BookingStatus::FULL_PAYMENT,
                    ]
                    : [
                        BookingStatus::DOWN_PAYMENT,
                        BookingStatus::FULL_PAYMENT,
                    ];

                $existingBooking = Booking::with(['passengers', 'rooms', 'addons'])
                    ->where('booking_number', $requestedBookingNumber)
                    ->where('user_id', $user->id)
                    ->where('tour_id', $tour->id)
                    ->whereIn('status', $requestedBookingStatuses)
                    ->whereDate('departure_date', request()->query('date'))
                    ->whereDate('departure_date', '>=', now()->toDateString())
                    ->latest()
                    ->first();
            }

            if (! $existingBooking && ! $forceNewBooking && $isScheduleBookable) {
                $bookingConflict = Booking::query()
                    ->where('user_id', $user->id)
                    ->where('tour_id', $tour->id)
                    ->whereIn('status', [
                        BookingStatus::WAITING_PAYMENT_APPROVAL,
                        BookingStatus::DOWN_PAYMENT,
                    ])
                    ->whereDate('departure_date', request()->query('date'))
                    ->whereDate('departure_date', '>=', now()->toDateString())
                    ->latest()
                    ->first();
            }

            if (! $existingBooking && ! $bookingConflict && ! $forceNewBooking && $isScheduleBookable) {
                $existingBooking = Booking::with(['passengers', 'rooms', 'addons'])
                    ->where('user_id', $user->id)
                    ->where('tour_id', $tour->id)
                    ->whereIn('status', array_filter(
                        $resumableStatuses,
                        fn (BookingStatus $status): bool => $status !== BookingStatus::EXPIRED
                    ))
                    ->whereDate('departure_date', request()->query('date'))
                    ->latest()
                    ->first();
            }

            if (! $existingBooking && ! $bookingConflict && $forceNewBooking && $isScheduleBookable) {
                $existingBooking = Booking::with(['passengers', 'rooms', 'addons'])
                    ->where('user_id', $user->id)
                    ->where('tour_id', $tour->id)
                    ->whereIn('status', $draftStatuses)
                    ->whereDate('departure_date', request()->query('date'))
                    ->latest()
                    ->first();
            }

            if ($existingBooking) {
                $existingBooking = app(BookingPricingService::class)->reconcileSnapshotTotals($existingBooking);
                $existingBooking = app(ReconcileBookingPaymentAfterRepriceAction::class)
                    ->reconcileStaleStatusIfBalanceDue($existingBooking);
                $existingBooking->loadMissing(['passengers', 'rooms', 'addons']);
                $bookingNumber = $existingBooking->booking_number;
                $isResumingExistingBooking = true;
                $isWaitingListBooking = $isWaitingListBooking || $this->isWaitingListOfferBooking($existingBooking);
            }
        }

        if ($schedule) {
            $addOns = $this->buildAddOnOptions($tour, $schedule, $existingBooking);
        }

        $paymentWorkflowService = app(BookingPaymentWorkflowService::class);
        $reschedulePayment = app(BookingReschedulePayment::class);
        $paidAmount = $existingBooking
            ? $paymentWorkflowService->finalizablePaidAmount($existingBooking)
            : 0.0;
        $downPaymentPaidAt = $existingBooking
            ? $this->downPaymentPaidAtForBooking($existingBooking, $paymentWorkflowService)
            : null;
        $remainingBalance = $existingBooking
            ? $reschedulePayment->remainingBalance($existingBooking, $paidAmount)
            : 0.0;
        [$fullPaymentAvailable, $paymentUnavailableReason] = $this->fullPaymentAvailabilityForBooking(
            $existingBooking,
            $remainingBalance
        );
        $bookingSeatLimit = $availableSeats + $this->heldSeatCountForBooking(
            $existingBooking,
            $tour->id,
            $this->normalizeDateString($schedule?->departure_date),
            $tour->company_id
        );
        $latestPayment = $existingBooking?->payments()
            ->latest()
            ->first();
        $bookingPaymentResult = $existingBooking && $latestPayment
            ? $this->buildBookingPaymentResult($existingBooking->fresh(), $latestPayment)
            : null;

        $tour->setRelation(
            'schedules',
            $tour->schedules
                ->filter(fn ($tourSchedule) => (bool) $tourSchedule->is_active && $tourSchedule->departure_date >= $cutoffDate)
                ->values()
        );

        return Inertia::render('tours/bookings/create', [
            'tour' => $tour,
            'tourPrices' => $this->tourPricesForSchedule($tour, $schedule),
            'vendor' => $tour->company,
            'bookingNumber' => $bookingNumber,
            'existingBooking' => $existingBooking,
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
            'isResumingExistingBooking' => $isResumingExistingBooking,
            'isWaitingListBooking' => $isWaitingListBooking,
            'serverNow' => now()->toIso8601String(),
            'reservedExpiresAt' => $existingBooking?->reserved_expires_at?->toIso8601String(),
            'remainingHoldSeconds' => $this->remainingHoldSeconds($existingBooking),
            'paidAmount' => $paidAmount,
            'remainingBalance' => $remainingBalance,
            'downPaymentPaidAt' => $downPaymentPaidAt,
            'fullPaymentAvailable' => $fullPaymentAvailable,
            'paymentMethodAvailability' => [
                'manual' => (bool) ($paymentReceiverPartnership?->manual_payment_enabled ?? true),
                'online' => (bool) ($paymentReceiverPartnership?->online_payment_enabled ?? true),
            ],
            'paymentUnavailableReason' => $paymentUnavailableReason,
            'bookingPaymentResult' => $bookingPaymentResult,
            'savedPassengers' => $user instanceof User
                ? $this->buildSavedPassengerOptions($user, $schedule?->departure_date)
                : [],
            'bookingConflict' => $bookingConflict && request()->query('date')
                ? $this->buildBookingConflict($bookingConflict, $tour, (string) request()->query('date'))
                : null,
        ]);
    }

    /**
     * Store a newly created booking.
     */
    public function store(string $username, StoreBookingRequest $request, BookingService $bookingService): RedirectResponse
    {
        try {
            $validated = $request->validated();
            $tour = Tour::query()->findOrFail((int) $validated['tour_id']);
            $this->assertPaymentTypeAllowedForTour($tour, (string) $validated['payment_type']);

            $existingBooking = Booking::query()
                ->where('booking_number', data_get($validated, 'booking_number'))
                ->where('user_id', $request->user()->id)
                ->first();

            if ($existingBooking) {
                $this->ensureBookingNotExpired($existingBooking);
            }

            $booking = $bookingService->createBooking(
                $validated,
                $request->user()
            );

            return back()->with('success', 'Booking successfully created.');
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to create booking: '.$e->getMessage());
        }
    }

    public function update(
        UpdateBookingRequest $request,
        string|Booking $usernameOrBooking,
        BookingService $bookingService,
        ?Booking $booking = null
    ): RedirectResponse {
        $booking = $booking ?? $usernameOrBooking;
        abort_unless($booking instanceof Booking, 404);

        abort_unless($request->user()?->id === $booking->user_id, 403);

        abort_unless(in_array($booking->status, [
            BookingStatus::RESERVED,
            BookingStatus::BOOKING_RESERVED,
            BookingStatus::AWAITING_PAYMENT,
            BookingStatus::WAITING_PAYMENT_APPROVAL,
            BookingStatus::DOWN_PAYMENT,
            BookingStatus::FULL_PAYMENT,
        ], true), 422);

        $bookingService->updateBookingSnapshot($booking, $request->validated(), $request->user());

        return back()->with('success', 'Booking updated successfully.');
    }

    /**
     * Reserve a booking (set status to 'booking reserved' when entering step 2).
     */
    public function reserve(string $username, Tour $tour): RedirectResponse
    {
        $data = request()->validate([
            'tour_id' => ['required', 'exists:tours,id'],
            'departure_date' => ['required', 'date'],
            'pax_adult' => ['required', 'integer', 'min:0'],
            'pax_child' => ['required', 'integer', 'min:0'],
            'pax_infant' => ['required', 'integer', 'min:0'],
            'booking_number' => ['required', 'string'],
            'vendor_id' => ['nullable', 'exists:companies,id'],
            'agent_id' => ['nullable', 'exists:companies,id'],
            'contact_name' => ['nullable', 'string', 'max:255'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:50'],
            'contact_notes' => ['nullable', 'string', 'max:1000'],
            'total_price' => ['nullable', 'numeric', 'min:0'],
            'tax_amount' => ['nullable', 'numeric', 'min:0'],
            'platform_fee' => ['nullable', 'numeric', 'min:0'],
            'commission_amount' => ['nullable', 'numeric', 'min:0'],
            'grand_total' => ['nullable', 'numeric', 'min:0'],
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

        $tenant = request()->attributes->get('tenant');
        abort_unless($tenant instanceof Company, 422);

        app(ReserveCustomerBookingAction::class)->execute(
            request()->user(),
            $tour->loadMissing('visaCategory.items'),
            $data,
            $tenant,
        );

        return back();
    }

    public function releaseHold(Request $request, string|Booking $usernameOrBooking, ?Booking $booking = null): RedirectResponse
    {
        $booking = $booking ?? $usernameOrBooking;
        abort_unless($booking instanceof Booking, 404);

        $booking->loadMissing(['agent', 'vendor']);
        $company = $booking->agent ?? $booking->vendor;
        abort_unless($company instanceof Company, 422);

        try {
            app(ReleaseCustomerBookingHoldAction::class)->execute($request->user(), $booking, $company);
        } catch (ValidationException $exception) {
            abort(403, collect($exception->errors())->flatten()->first() ?? 'Unable to release booking hold.');
        }

        return back()->with('success', 'Booking hold released.');
    }

    public function updateTravelDocuments(Request $request, string|Booking $usernameOrBooking, ?Booking $booking = null): RedirectResponse
    {
        $booking = $booking ?? $usernameOrBooking;
        abort_unless($booking instanceof Booking, 404);
        abort_unless($request->user()?->id === $booking->user_id, 403);
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

        $updatedPassengers = DB::transaction(function () use ($request, $booking, $validated): array {
            $passengers = $booking->passengers()
                ->whereIn('id', collect($validated['passengers'])->pluck('id'))
                ->get()
                ->keyBy('id');
            $updatedPassengers = [];

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
                    $update['passport_file_path'] = $request
                        ->file("passengers.{$index}.passport_file")
                        ->store('travel-documents/passports', 'public');
                } else {
                    $update['passport_file_path'] = $passengerData['passport_file_path'] ?? null;
                }

                if ($request->hasFile("passengers.{$index}.visa_file")) {
                    $update['visa_file_path'] = $request
                        ->file("passengers.{$index}.visa_file")
                        ->store('travel-documents/visas', 'public');
                } else {
                    $update['visa_file_path'] = $passengerData['visa_file_path'] ?? null;
                }

                $passenger->update($update);
                $updatedPassengers[] = Arr::only($passenger->fresh()->getAttributes(), [
                    'title',
                    'first_name',
                    'last_name',
                    'gender',
                    'dob',
                    'pob',
                    'passport_number',
                    'passport_issue_date',
                    'passport_expiry_date',
                    'visa_number',
                    'passport_file_path',
                    'visa_file_path',
                ]);
            }

            return $updatedPassengers;
        });

        if ($request->user() instanceof User) {
            app(BookingService::class)->syncSavedPassengers($request->user(), $updatedPassengers);
        }

        return back()->with('success', 'Travel documents updated.');
    }

    public function paymentResult(Request $request, string|Booking $usernameOrBooking, ?Booking $booking = null): JsonResponse
    {
        $booking = $booking ?? $usernameOrBooking;
        abort_unless($booking instanceof Booking, 404);
        abort_unless($request->user()?->id === $booking->user_id, 403);

        $latestPayment = $booking->payments()
            ->latest()
            ->first();

        return response()->json([
            'bookingPaymentResult' => $this->buildBookingPaymentResult($booking->fresh(), $latestPayment),
        ]);
    }

    public function reorder(Request $request, Booking $booking): RedirectResponse
    {
        $booking->loadMissing(['agent', 'vendor', 'tour']);
        $company = $booking->agent ?? $booking->vendor;
        abort_unless($company instanceof Company, 422);

        try {
            $result = app(ReorderCustomerBookingAction::class)->execute(
                $request->user(),
                $booking,
                $company,
            );
        } catch (ValidationException $exception) {
            abort(422, collect($exception->errors())->flatten()->first() ?? 'Unable to reorder booking.');
        }

        $booking = $result['booking'];
        $tenantUsername = $booking->agent?->username ?? $booking->vendor?->username;

        abort_unless($tenantUsername && $booking->tour, 422);

        return redirect()->route('bookings.create', [
            'username' => $tenantUsername,
            'tour' => $booking->tour,
            'date' => $booking->departure_date->toDateString(),
            'booking_number' => $booking->booking_number,
        ]);
    }

    public function storeManualPayment(Request $request, string|Booking $usernameOrBooking, ?Booking $booking = null): RedirectResponse
    {
        $booking = $booking ?? $usernameOrBooking;
        abort_unless($booking instanceof Booking, 404);
        abort_unless($request->user()?->id === $booking->user_id, 403);
        $booking = $this->ensureBookingNotExpired($booking);

        $validated = $request->validate([
            'sender_bank_name' => ['required', 'string', 'max:255'],
            'sender_account_number' => ['required', 'string', 'max:255', 'regex:/^\d+$/'],
            'transfer_amount' => ['required', 'numeric', 'min:1'],
            'payment_type' => ['required', 'string', 'in:down_payment,full_payment'],
            'payment_date' => ['required', 'date', 'before_or_equal:today'],
            'proof' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ]);

        $this->assertCustomerCanStartPayment(
            $booking,
            (float) $validated['transfer_amount'],
            (string) $validated['payment_type']
        );

        $payment = DB::transaction(function () use ($request, $booking, $validated): Payment {
            $paymentReceiver = app(BookingPaymentReceiverService::class)->resolveForBooking($booking);
            $paymentWorkflowPayload = app(BookingPaymentWorkflowService::class)
                ->initialPaymentPayload($paymentReceiver, (string) $validated['payment_type']);
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

            $this->markBookingManualPaymentInProgress($booking);

            return $payment;
        });

        app(SyncAvailabilityAction::class)->executeForBooking($booking->fresh());
        app(NotifyBookingPaymentEventAction::class)->execute($booking->fresh(), 'manual_payment_submitted', $payment->fresh());

        return back()
            ->with('success', 'Payment proof submitted. We will verify shortly.')
            ->with('bookingPaymentResult', $this->buildBookingPaymentResult($booking->fresh(), $payment->fresh()));
    }

    public function storeOnlinePayment(Request $request, string|Booking $usernameOrBooking, ?Booking $booking = null): JsonResponse
    {
        $booking = $booking ?? $usernameOrBooking;
        abort_unless($booking instanceof Booking, 404);
        abort_unless($request->user()?->id === $booking->user_id, 403);

        $validated = $request->validate([
            'payment_type' => ['required', 'string', 'in:down_payment,full_payment'],
            'amount' => ['required', 'numeric', 'min:1'],
            'payment_method_id' => ['required', 'exists:payment_methods,id'],
        ]);

        $paymentMethod = $this->resolveEnabledBookingOnlinePaymentMethod((int) $validated['payment_method_id']);
        $booking = $this->ensureBookingNotExpired($booking->fresh());

        return DB::transaction(function () use ($request, $booking, $validated, $paymentMethod): JsonResponse {
            $booking = Booking::query()
                ->whereKey($booking->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($booking->status === BookingStatus::EXPIRED) {
                throw ValidationException::withMessages([
                    'booking' => 'This booking reservation has expired. Please start a new booking.',
                ]);
            }

            app(AssertBookingOnlinePaymentStartAllowedAction::class)->assert($booking);

            $this->assertCustomerCanStartPayment(
                $booking,
                (float) $validated['amount'],
                (string) $validated['payment_type']
            );

            $paymentReceiver = app(BookingPaymentReceiverService::class)->resolveForBooking($booking);
            $paymentWorkflowPayload = app(BookingPaymentWorkflowService::class)
                ->initialPaymentPayload($paymentReceiver, (string) $validated['payment_type']);

            if ($reusableResponse = $this->reusablePrismaLinkOnlinePaymentResponse($request, $booking, $validated, $paymentWorkflowPayload)) {
                return $reusableResponse;
            }

            return $this->storePrismaLinkOnlinePayment(
                $request,
                $booking,
                $validated,
                $paymentWorkflowPayload,
                $paymentMethod,
            );
        });
    }

    /**
     * @param  array<string, mixed>  $validated
     * @param  array<string, mixed>  $paymentWorkflowPayload
     */
    private function reusablePrismaLinkOnlinePaymentResponse(
        Request $request,
        Booking $booking,
        array $validated,
        array $paymentWorkflowPayload,
    ): ?JsonResponse {
        $reusablePayment = app(ReusablePrismaLinkBookingPaymentAttemptService::class)->findReusableAttempt(
            $booking,
            get_class($request->user()),
            (int) $request->user()->id,
            (string) $validated['payment_type'],
            (float) $validated['amount'],
            $paymentWorkflowPayload,
        );

        if (! $reusablePayment) {
            return null;
        }

        $this->markBookingOnlinePaymentInProgress($booking);

        return response()->json([
            'payment' => $this->onlinePaymentResponsePayload($reusablePayment->fresh(), true),
            'bookingPaymentResult' => $this->buildBookingPaymentResult($booking->fresh(), $reusablePayment->fresh()),
        ]);
    }

    /**
     * @param  array<string, mixed>  $validated
     * @param  array<string, mixed>  $paymentWorkflowPayload
     */
    private function storePrismaLinkOnlinePayment(
        Request $request,
        Booking $booking,
        array $validated,
        array $paymentWorkflowPayload,
        PaymentMethod $paymentMethod,
    ): JsonResponse {
        $payment = $this->runPrismaLinkOnlinePaymentTransaction(function () use ($request, $booking, $validated, $paymentWorkflowPayload, $paymentMethod): Payment {
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
                Log::warning('PrismaLink booking payment initiation failed', [
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

            $this->markBookingOnlinePaymentInProgress($booking);

            return $payment;
        });

        app(SyncAvailabilityAction::class)->executeForBooking($booking->fresh());
        app(NotifyBookingPaymentEventAction::class)->execute($booking->fresh(), 'online_payment_pending', $payment->fresh());

        return response()->json([
            'payment' => $this->onlinePaymentResponsePayload($payment->fresh(), false),
            'bookingPaymentResult' => $this->buildBookingPaymentResult($booking->fresh(), $payment->fresh()),
        ]);
    }

    private function markBookingOnlinePaymentInProgress(Booking $booking): void
    {
        $booking->update([
            'status' => $this->pendingOnlinePaymentBookingStatus($booking),
            'payment_mode' => 'online',
            'reserved_type' => 'payment_in_progress',
            'reserved_expires_at' => null,
        ]);
    }

    /**
     * @template TReturn
     *
     * @param  callable(): TReturn  $callback
     * @return TReturn
     */
    private function runPrismaLinkOnlinePaymentTransaction(callable $callback): mixed
    {
        if (DB::transactionLevel() > 0) {
            return $callback();
        }

        return DB::transaction($callback);
    }

    private function markBookingManualPaymentInProgress(Booking $booking): void
    {
        $booking->update([
            'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
            'payment_mode' => 'manual',
            'reserved_type' => 'payment_in_progress',
            'reserved_expires_at' => null,
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
            : $prismaLinkService->defaultValidityExpiresAt();
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

    public function confirmOnlinePayment(
        Request $request,
        Booking $booking,
        Payment $payment
    ): JsonResponse {
        abort_unless($request->user()?->id === $booking->user_id, 403);
        abort_unless($payment->payable_type === Booking::class, 404);
        abort_unless((int) $payment->payable_id === (int) $booking->id, 404);

        if ($payment->provider === 'prismalink') {
            return $this->confirmPrismaLinkOnlinePayment($booking, $payment);
        }

        abort_unless($payment->provider === 'midtrans', 422);

        $orderId = data_get($payment->payload, 'order_id')
            ?? data_get($payment->payload, 'request.transaction_details.order_id');

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
            Log::warning('PrismaLink booking payment status sync failed', [
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
        } else {
            app(BookingContactPaymentEmailService::class)
                ->sendOnlinePaymentConfirmedIfEligible($booking->fresh(), $freshPayment);
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

    public function confirmTenantOnlinePayment(
        Request $request,
        string $username,
        Booking $booking,
        Payment $payment
    ): JsonResponse {
        return $this->confirmOnlinePayment($request, $booking, $payment);
    }

    private function isWaitingListOfferBooking(Booking $booking): bool
    {
        if ($booking->reserved_type === 'waiting_list_offer') {
            return true;
        }

        return TourWaitingListSchedule::query()
            ->where('booking_id', $booking->id)
            ->exists();
    }

    private function tourPricesForSchedule(Tour $tour, ?TourSchedule $schedule, ?int $agentId = null): Collection
    {
        return TourPrice::query()
            ->with('priceCategory:id,name,description')
            ->where('tour_code', $tour->code)
            ->when($schedule, fn ($query) => $query->where('schedule_id', $schedule->id))
            ->orderBy('id')
            ->get()
            ->unique('price_category_id')
            ->map(function (TourPrice $price) use ($tour, $schedule, $agentId): array {
                $agentCommissions = $agentId
                    ? $this->agentCommissionsForPrice($tour, $schedule, $price, collect([$agentId]))
                    : [];

                return [
                    'tourPriceId' => $price->id,
                    'categoryName' => $price->priceCategory?->name ?? 'Single',
                    'description' => $price->priceCategory?->description ?? '',
                    'price' => (float) $price->price,
                    'promotionRate' => (float) $price->promotion_rate,
                    'promotion' => (float) $price->promotion,
                    'commissionRate' => (float) $price->commission_rate,
                    'commission' => (float) $price->commission,
                    'effectiveCommission' => $agentId ? ($agentCommissions[(string) $agentId] ?? null) : null,
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

    private function mapMidtransStatus(mixed $midtransStatus): PaymentStatus
    {
        return match ($midtransStatus) {
            'capture', 'settlement' => PaymentStatus::PAID,
            'pending' => PaymentStatus::PENDING,
            'deny', 'cancel', 'expire' => PaymentStatus::FAILED,
            default => PaymentStatus::PENDING,
        };
    }

    /**
     * @return array<int, array{
     *     id: int,
     *     title: string|null,
     *     firstName: string,
     *     lastName: string|null,
     *     dateOfBirth: string|null,
     *     travelerType: string|null,
     *     placeOfBirth: string|null,
     *     passportNumber: string|null,
     *     passportIssueDate: string|null,
     *     passportExpiryDate: string|null,
     *     visaNumber: string|null,
     *     passportFilePath: string|null,
     *     passportFileName: string|null,
     *     visaFilePath: string|null,
     *     visaFileName: string|null
     * }>
     */
    private function buildSavedPassengerOptions(User $user, mixed $departureDate): array
    {
        return $user->savedPassengers()
            ->latest('updated_at')
            ->get()
            ->map(fn ($passenger): array => [
                'id' => $passenger->id,
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
                'passportFileName' => $this->fileNameFromPath($passenger->passport_file_path),
                'visaFilePath' => $passenger->visa_file_path,
                'visaFileName' => $this->fileNameFromPath($passenger->visa_file_path),
            ])
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

    private function fileNameFromPath(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        return basename(str_replace('\\', '/', $path));
    }

    /**
     * @return array{
     *     bookingNumber: string,
     *     status: string,
     *     checkPaymentStatusUrl: string,
     *     continuePaymentUrl: string,
     *     newBookingUrl: string
     * }
     */
    private function buildBookingConflict(Booking $booking, Tour $tour, string $departureDate): array
    {
        return [
            'bookingNumber' => $booking->booking_number,
            'status' => $booking->status->value,
            'checkPaymentStatusUrl' => '/mybookings?'.http_build_query([
                'tab' => 'current',
                'booking_number' => $booking->booking_number,
            ]),
            'continuePaymentUrl' => $this->bookingCreatePath($tour, $departureDate, [
                'booking_number' => $booking->booking_number,
            ]),
            'newBookingUrl' => $this->bookingCreatePath($tour, $departureDate, [
                'force_new' => 1,
            ]),
        ];
    }

    /**
     * @param  array<string, mixed>  $parameters
     */
    private function bookingCreatePath(Tour $tour, string $departureDate, array $parameters = []): string
    {
        return '/bookings/'.$tour->id.'/create?'.http_build_query([
            'date' => $departureDate,
            ...$parameters,
        ]);
    }

    private function assertCustomerCanStartPayment(Booking $booking, float $incomingAmount, string $paymentType): void
    {
        $this->assertPaymentTypeAllowedForBooking($booking, $paymentType);
        app(BookingDownPaymentRuleService::class)->assertIncomingDownPaymentAmount($booking, $incomingAmount, $paymentType);
        $this->assertFullPaymentCoversRemainingBalance($booking, $incomingAmount, $paymentType);

        try {
            app(FinalizeBookingPaymentAction::class)
                ->assertCanFinalizeIncomingAmount(
                    $booking->fresh(),
                    $incomingAmount,
                    seatContext: BookingAvailabilityContext::Payment,
                );
        } catch (ValidationException $exception) {
            $paymentMessage = $exception->errors()['payment'][0] ?? null;

            if ($paymentMessage !== null) {
                throw $exception;
            }

            throw ValidationException::withMessages([
                'payment' => self::CUSTOMER_PAYMENT_UNAVAILABLE_MESSAGE,
            ]);
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

        return BookingStatus::BOOKING_RESERVED;
    }

    private function midtransEnvironment(): string
    {
        return (bool) config('midtrans.is_production') ? 'production' : 'sandbox';
    }

    private function assertPaymentTypeAllowedForTour(Tour $tour, string $paymentType): void
    {
        if ($paymentType !== 'down_payment') {
            return;
        }

        app(BookingDownPaymentRuleService::class)->assertPaymentTypeAvailableForTour($tour, $paymentType);
    }

    private function assertPaymentTypeAllowedForBooking(Booking $booking, string $paymentType): void
    {
        app(BookingDownPaymentRuleService::class)->assertPaymentTypeAvailableForBooking($booking, $paymentType);
    }

    /**
     * @return array{0: bool, 1: string|null}
     */
    private function fullPaymentAvailabilityForBooking(?Booking $booking, float $incomingAmount): array
    {
        if (
            ! $booking
            || $incomingAmount <= 0
            || (float) $booking->grand_total <= 0
            || ! $this->bookingHasPricingSnapshot($booking)
        ) {
            return [true, null];
        }

        try {
            app(FinalizeBookingPaymentAction::class)
                ->assertCanFinalizeIncomingAmount(
                    $booking->fresh(),
                    $incomingAmount,
                    seatContext: BookingAvailabilityContext::Payment,
                );

            return [true, null];
        } catch (ValidationException $exception) {
            $paymentMessage = $exception->errors()['payment'][0] ?? null;

            return [false, $paymentMessage ?? self::CUSTOMER_PAYMENT_UNAVAILABLE_MESSAGE];
        }
    }

    private function bookingHasPricingSnapshot(Booking $booking): bool
    {
        if ($booking->relationLoaded('passengers')) {
            return $booking->passengers->isNotEmpty();
        }

        return $booking->passengers()->exists();
    }

    private function buildAddOnOptions(Tour $tour, TourSchedule $schedule, ?Booking $booking = null): array
    {
        return app(BookingAddOnOptionsService::class)->forSchedule($tour, $schedule, $booking);
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

    /**
     * @return array{
     *     bookingId: int,
     *     bookingNumber: string,
     *     bookingStatus: string,
     *     paymentStatus: string,
     *     paymentMode: string|null,
     *     tourName: string,
     *     tourCode: string|null,
     *     destination: string|null,
     *     departureDate: string|null,
     *     returnDate: string|null,
     *     paxSummary: string,
     *     grandTotal: float,
     *     paidAmount: float,
     *     remainingBalance: float,
     *     image: mixed
     * }
     */
    private function buildBookingPaymentResult(Booking $booking, ?Payment $payment = null): array
    {
        $booking->loadMissing(['tour.image', 'payments']);

        $paidAmount = app(BookingPaymentWorkflowService::class)->finalizablePaidAmount($booking);
        $reschedulePayment = app(BookingReschedulePayment::class);
        $grandTotal = $reschedulePayment->effectiveGrandTotalForPayment($booking, $paidAmount);
        $latestPayment = $payment ?? $booking->payments()
            ->latest()
            ->first();
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

    private function downPaymentPaidAtForBooking(Booking $booking, BookingPaymentWorkflowService $paymentWorkflowService): ?string
    {
        $payment = $paymentWorkflowService->finalizablePaidPayments($booking)
            ->filter(fn (Payment $payment): bool => $payment->bookingPaymentType() === 'down_payment')
            ->sortByDesc(fn (Payment $payment): string => (string) ($payment->paid_at ?? $payment->created_at))
            ->first();

        if (! $payment) {
            return null;
        }

        $payloadPaymentDate = data_get($payment->payload, 'payment_date');

        if (filled($payloadPaymentDate)) {
            return Carbon::parse($payloadPaymentDate)->toDateString();
        }

        return ($payment->paid_at ?? $payment->created_at)?->toJSON();
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

    private function resolveBookableSchedule(Tour $tour, string $departureDate, ?int $companyId = null): ?TourSchedule
    {
        if (! $this->isDepartureDateInsideBookingWindow($tour, $departureDate)) {
            return null;
        }

        return $this->resolveActiveSchedule($tour, $departureDate, $companyId);
    }

    private function isDepartureDateInsideBookingWindow(Tour $tour, string $departureDate): bool
    {
        $tour->loadMissing('company.companySetting');

        $parsedDepartureDate = Carbon::parse($departureDate)->startOfDay();
        $deadlineDays = (int) ($tour->company?->companySetting?->booking_deadline ?? 0);
        $cutoffDate = now()->startOfDay()->addDays($deadlineDays);

        return $parsedDepartureDate->gte($cutoffDate);
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

    private function buildPaxSummary(Booking $booking): string
    {
        $segments = [];
        $adultCount = (int) $booking->pax_adult;
        $childCount = (int) $booking->pax_child;
        $infantCount = (int) $booking->pax_infant;

        if ($adultCount > 0) {
            $segments[] = $adultCount.' adult'.($adultCount === 1 ? '' : 's');
        }

        if ($childCount > 0) {
            $segments[] = $childCount.' child'.($childCount === 1 ? '' : 'ren');
        }

        if ($infantCount > 0) {
            $segments[] = $infantCount.' infant'.($infantCount === 1 ? '' : 's');
        }

        return implode(', ', $segments) ?: 'No guests';
    }

    private function resolveBookingTimeLimitMinutes(Tour $tour): int
    {
        $tour->loadMissing('company.companySetting');

        $minutes = (int) ($tour->company?->companySetting?->booking_entry_time_limit ?? 0);

        return $minutes > 0 ? $minutes : 10;
    }

    private function remainingHoldSeconds(?Booking $booking): ?int
    {
        if (
            ! $booking
            || $booking->status !== BookingStatus::BOOKING_RESERVED
            || ! $booking->reserved_expires_at
        ) {
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

    private function heldSeatCountForBooking(
        ?Booking $booking,
        ?int $tourId = null,
        ?string $departureDate = null,
        ?int $vendorId = null
    ): int {
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
}
