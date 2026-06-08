<?php

namespace App\Http\Controllers;

use App\Actions\Booking\ExpireBookingReservationsAction;
use App\Actions\Booking\FinalizeBookingPaymentAction;
use App\Actions\Booking\NotifyBookingPaymentEventAction;
use App\Actions\Booking\SyncAvailabilityAction;
use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Http\Requests\StoreBookingRequest;
use App\Http\Requests\UpdateBookingRequest;
use App\Models\Booking;
use App\Models\BookingDocument;
use App\Models\Payment;
use App\Models\Tour;
use App\Models\TourAddOn;
use App\Models\TourAvailability;
use App\Models\TourPrice;
use App\Models\TourSchedule;
use App\Models\User;
use App\Services\BookingContactPaymentEmailService;
use App\Services\BookingDownPaymentRuleService;
use App\Services\BookingNumberService;
use App\Services\BookingPaymentReceiverService;
use App\Services\BookingPaymentWorkflowService;
use App\Services\BookingPricingService;
use App\Services\BookingRoomArrangementValidator;
use App\Services\BookingService;
use App\Services\ReusableMidtransBookingPaymentAttemptService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Midtrans\Snap;
use Midtrans\Transaction;
use Throwable;

class BookingController extends Controller
{
    private const CUSTOMER_PAYMENT_UNAVAILABLE_MESSAGE = 'Payment is temporarily unavailable. Please try again later or contact customer support.';

    private const ONLINE_PAYMENT_UNAVAILABLE_MESSAGE = 'Online payment is temporarily unavailable. Please try again later or contact customer support.';

    /**
     * Show the form for creating a new booking.
     */
    public function create(string $username, Tour $tour, BookingNumberService $bookingNumberService): Response
    {
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

            if ($requestedBookingNumber !== '') {
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
                $bookingNumber = $existingBooking->booking_number;
                $isResumingExistingBooking = true;
            }
        }

        if ($schedule) {
            $addOns = $this->buildAddOnOptions($tour, $schedule, $existingBooking);
        }

        $paymentWorkflowService = app(BookingPaymentWorkflowService::class);
        $paidAmount = $existingBooking
            ? $paymentWorkflowService->finalizablePaidAmount($existingBooking)
            : 0.0;
        $downPaymentPaidAt = $existingBooking
            ? $this->downPaymentPaidAtForBooking($existingBooking, $paymentWorkflowService)
            : null;
        $remainingBalance = $existingBooking
            ? max(0.0, (float) $existingBooking->grand_total - $paidAmount)
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
            'tourPrices' => TourPrice::with('priceCategory:id,name,description')
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
                ->values(),
            'vendor' => $tour->company,
            'bookingNumber' => $bookingNumber,
            'existingBooking' => $existingBooking,
            'roomTypes' => [],
            'availability' => $availableSeats,
            'bookingSeatLimit' => $bookingSeatLimit,
            'addOns' => $addOns,
            'bookingDeadlineDays' => $deadlineDays,
            'bookingTimeLimitMinutes' => $bookingTimeLimitMinutes,
            'downPaymentAvailable' => $downPaymentAvailable,
            'minimumDownPaymentPct' => $minimumDownPaymentPct,
            'downPaymentRule' => $downPaymentRule,
            'minimumVatPct' => (float) ($settings?->minimum_vat ?? 11),
            'platformFeePerPax' => app(BookingPricingService::class)->platformFeePerPax(),
            'vendorBankInfo' => [
                'bankName' => $paymentReceiverSettings?->manual_bank_transfer ?? '',
                'accountName' => $paymentReceiverSettings?->manual_bank_transfer_account_name ?? '',
                'accountNumber' => $paymentReceiverSettings?->manual_bank_transfer_account_number ?? '',
            ],
            'termConditions' => $settings?->term_conditions,
            'isResumingExistingBooking' => $isResumingExistingBooking,
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

        if (! $this->resolveBookableSchedule($tour, (string) $data['departure_date'])) {
            throw ValidationException::withMessages([
                'departure_date' => 'Booking window closed.',
            ]);
        }

        app(BookingRoomArrangementValidator::class)->validatePassengerMix($data['passengers'] ?? []);

        $bookingTimeLimitMinutes = $this->resolveBookingTimeLimitMinutes($tour);

        $booking = DB::transaction(function () use ($data, $tour, $bookingTimeLimitMinutes) {
            $vendorId = (int) ($data['vendor_id'] ?? $tour->company_id);
            $existingBooking = Booking::query()
                ->where('booking_number', $data['booking_number'])
                ->where('user_id', request()->user()->id)
                ->lockForUpdate()
                ->first();

            $schedule = $this->resolveBookableSchedule($tour, (string) $data['departure_date'], $vendorId);
            if (! $schedule) {
                throw ValidationException::withMessages([
                    'departure_date' => 'Booking window closed.',
                ]);
            }

            $availability = TourAvailability::query()
                ->where('company_id', $vendorId)
                ->where('tour_id', $tour->id)
                ->where('schedule_id', $schedule->id)
                ->lockForUpdate()
                ->first();

            $bookingSeatLimit = ($availability ? (int) $availability->available : 0)
                + $this->heldSeatCountForBooking(
                    $existingBooking,
                    $tour->id,
                    $this->normalizeDateString($schedule->departure_date),
                    $vendorId
                );
            $requestedSeatCount = (int) $data['pax_adult']
                + (int) $data['pax_child']
                + (int) $data['pax_infant'];

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
                (float) ($tour->company?->companySetting?->minimum_vat ?? 11),
                ! empty($data['agent_id']),
                ! empty($data['agent_id']) ? (int) $data['agent_id'] : null,
            );
            $totals = app(BookingPricingService::class)->bookingTotalsFromQuote($quote);

            $reservedExpiresAt = $existingBooking?->status === BookingStatus::BOOKING_RESERVED
                && $existingBooking->reserved_expires_at
                && $existingBooking->reserved_expires_at->isFuture()
                    ? $existingBooking->reserved_expires_at
                    : now()->addMinutes($bookingTimeLimitMinutes);

            $booking = Booking::updateOrCreate(
                [
                    'booking_number' => $data['booking_number'],
                    'user_id' => request()->user()->id,
                ],
                [
                    'tour_id' => $data['tour_id'],
                    'departure_date' => $data['departure_date'],
                    'pax_adult' => $data['pax_adult'],
                    'pax_child' => $data['pax_child'],
                    'pax_infant' => $data['pax_infant'],
                    'status' => BookingStatus::BOOKING_RESERVED,
                    'reserved_type' => 'system',
                    'reserved_expires_at' => $reservedExpiresAt,
                    'vendor_id' => $vendorId,
                    'agent_id' => $data['agent_id'] ?? null,
                    'total_price' => $totals['total_price'],
                    'tax_amount' => $totals['tax_amount'],
                    'platform_fee' => $totals['platform_fee'],
                    'commission_amount' => $totals['commission_amount'],
                    'grand_total' => $totals['grand_total'],
                    'contact_name' => $data['contact_name'] ?? null,
                    'contact_email' => $data['contact_email'] ?? null,
                    'contact_phone' => $data['contact_phone'] ?? null,
                    'contact_notes' => $data['contact_notes'] ?? null,
                    'input_by_user_id' => request()->user()->id,
                    'input_by_company_id' => null,
                    'input_by_role' => 'customer',
                ]
            );

            if (! empty($data['passengers'])) {
                $booking->passengers()->delete();
                $booking->passengers()->createMany($quote['passengers']);
            }

            return $booking;
        });

        app(SyncAvailabilityAction::class)->executeForBooking($booking->fresh());

        return back();
    }

    public function releaseHold(Request $request, string|Booking $usernameOrBooking, ?Booking $booking = null): RedirectResponse
    {
        $booking = $booking ?? $usernameOrBooking;
        abort_unless($booking instanceof Booking, 404);
        abort_unless($request->user()?->id === $booking->user_id, 403);

        $booking = DB::transaction(function () use ($booking): Booking {
            $lockedBooking = Booking::query()
                ->whereKey($booking->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (
                $lockedBooking->status === BookingStatus::BOOKING_RESERVED
                && $lockedBooking->reserved_type === 'system'
            ) {
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
        abort_unless($request->user()?->id === $booking->user_id, 403);

        $booking = app(ExpireBookingReservationsAction::class)->expireIfDue($booking);
        $booking->loadMissing(['agent', 'vendor', 'tour']);

        $status = $booking->status;

        abort_unless(in_array($status, [
            BookingStatus::EXPIRED,
            BookingStatus::AWAITING_PAYMENT,
            BookingStatus::BOOKING_RESERVED,
        ], true), 422);
        abort_unless($booking->departure_date?->isToday() || $booking->departure_date?->isFuture(), 422);
        abort_unless(
            $booking->tour && $this->resolveBookableSchedule(
                $booking->tour,
                $booking->departure_date->toDateString(),
                $booking->vendor_id
            ),
            422
        );

        if ($status === BookingStatus::EXPIRED) {
            DB::transaction(function () use ($booking): void {
                $booking->update([
                    'status' => BookingStatus::AWAITING_PAYMENT,
                    'reserved_type' => 'system',
                    'reserved_expires_at' => null,
                ]);
            });

            app(SyncAvailabilityAction::class)->executeForBooking($booking->fresh());
        }

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

    public function storeOnlinePayment(Request $request, string|Booking $usernameOrBooking, ?Booking $booking = null): JsonResponse
    {
        $booking = $booking ?? $usernameOrBooking;
        abort_unless($booking instanceof Booking, 404);
        abort_unless($request->user()?->id === $booking->user_id, 403);
        $booking = $this->ensureBookingNotExpired($booking);

        $validated = $request->validate([
            'payment_type' => ['required', 'string', 'in:down_payment,full_payment'],
            'amount' => ['required', 'numeric', 'min:1'],
        ]);

        $this->assertCustomerCanStartPayment(
            $booking,
            (float) $validated['amount'],
            (string) $validated['payment_type']
        );

        $paymentReceiver = app(BookingPaymentReceiverService::class)->resolveForBooking($booking);
        $paymentWorkflowPayload = app(BookingPaymentWorkflowService::class)
            ->initialPaymentPayload($paymentReceiver, (string) $validated['payment_type']);
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
                'status' => $this->pendingOnlinePaymentBookingStatus($booking),
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

        $payment = DB::transaction(function () use ($request, $booking, $validated, $paymentWorkflowPayload, $reusableAttemptService) {
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
                    'first_name' => $request->user()->name,
                    'email' => $request->user()->email,
                ],
                'callbacks' => [
                    'finish' => url('/mybookings'),
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

                throw ValidationException::withMessages([
                    'payment' => self::ONLINE_PAYMENT_UNAVAILABLE_MESSAGE,
                ]);
            }

            $payload = [
                ...$paymentWorkflowPayload,
                'order_id' => $orderId,
                'snap_token' => $snapToken,
                'snap_token_expires_at' => $snapTokenExpiresAt->toISOString(),
                'request' => $params,
            ];

            if (! $snapToken) {
                throw ValidationException::withMessages([
                    'payment' => self::ONLINE_PAYMENT_UNAVAILABLE_MESSAGE,
                ]);
            }

            $payment->update([
                'status' => 'pending',
                'payload' => $payload,
                'expired_at' => $snapTokenExpiresAt,
            ]);

            $booking->update([
                'status' => $this->pendingOnlinePaymentBookingStatus($booking),
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

    public function confirmOnlinePayment(
        Request $request,
        Booking $booking,
        Payment $payment
    ): JsonResponse {
        abort_unless($request->user()?->id === $booking->user_id, 403);
        abort_unless($payment->payable_type === Booking::class, 404);
        abort_unless((int) $payment->payable_id === (int) $booking->id, 404);
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

    public function confirmTenantOnlinePayment(
        Request $request,
        string $username,
        Booking $booking,
        Payment $payment
    ): JsonResponse {
        return $this->confirmOnlinePayment($request, $booking, $payment);
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
                ->assertCanFinalizeIncomingAmount($booking->fresh(), $incomingAmount);
        } catch (ValidationException) {
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
                ->assertCanFinalizeIncomingAmount($booking->fresh(), $incomingAmount);

            return [true, null];
        } catch (ValidationException) {
            return [false, self::CUSTOMER_PAYMENT_UNAVAILABLE_MESSAGE];
        }
    }

    private function bookingHasPricingSnapshot(Booking $booking): bool
    {
        if ($booking->relationLoaded('passengers')) {
            return $booking->passengers->isNotEmpty();
        }

        return $booking->passengers()->exists();
    }

    /**
     * @return array<int, array{key: string, label: string, unitPrice: float, qty: int, hasQty: bool, isTaxable: bool}>
     */
    private function buildAddOnOptions(Tour $tour, TourSchedule $schedule, ?Booking $booking = null): array
    {
        $booking?->loadMissing('addons');

        $bookingAddOns = $booking
            ? $booking->addons->keyBy(fn ($addon): string => strtolower((string) $addon->name))
            : collect();

        $addOns = TourAddOn::query()
            ->where('schedule_id', $schedule->id)
            ->where('tour_id', $tour->id)
            ->get()
            ->map(function (TourAddOn $addon) use ($bookingAddOns): array {
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
            ->map(fn ($label): string => strtolower((string) $label))
            ->all();

        foreach ($booking?->addons ?? [] as $bookingAddon) {
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

        return $addOns;
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
        $grandTotal = (float) $booking->grand_total;
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
            'remainingBalance' => max(0.0, $grandTotal - $paidAmount),
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

        return max(0, (int) $booking->pax_adult + (int) $booking->pax_child + (int) $booking->pax_infant);
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
