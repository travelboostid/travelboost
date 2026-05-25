<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Actions\Booking\ExpireBookingReservationsAction;
use App\Actions\Booking\FinalizeBookingPaymentAction;
use App\Actions\Booking\NotifyBookingPaymentEventAction;
use App\Actions\Booking\SyncAvailabilityAction;
use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBookingRequest;
use App\Models\AgentTour;
use App\Models\Booking;
use App\Models\BookingDocument;
use App\Models\Company;
use App\Models\Payment;
use App\Models\Tour;
use App\Models\TourAddOn;
use App\Models\TourAvailability;
use App\Models\TourPrice;
use App\Models\TourSchedule;
use App\Models\User;
use App\Services\BookingNumberService;
use App\Services\BookingPaymentReceiverService;
use App\Services\BookingPricingService;
use App\Services\BookingService;
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

class DashboardBookingController extends Controller
{
    private const PAYMENT_UNAVAILABLE_MESSAGE = 'Payment is temporarily unavailable. Please try again later or contact customer support.';

    private const ONLINE_PAYMENT_UNAVAILABLE_MESSAGE = 'Online payment is temporarily unavailable. Please try again later or contact customer support.';

    public function create(Company $company, Tour $tour): Response
    {
        $this->assertCompanyCanBookTour($company, $tour);

        $tour->load('company.companySetting', 'schedules.availability');
        $settings = $tour->company?->companySetting;
        $deadlineDays = (int) ($settings?->booking_deadline ?? 0);
        $bookingTimeLimitMinutes = $this->resolveBookingTimeLimitMinutes($tour);
        $minimumDownPaymentPct = $this->minimumDownPaymentPct($settings?->minimum_down_payment);
        $downPaymentAvailable = $minimumDownPaymentPct !== null;
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
                ])
                ->values()
                ->toArray();
        }

        $requestedBookingNumber = request()->string('booking_number')->trim()->toString();
        $bookingNumber = null;
        $dashboardUser = request()->user();
        $agent = $this->dashboardAgent($company, $tour);
        $existingBooking = null;

        if ($dashboardUser && $schedule && $isScheduleBookable && $requestedBookingNumber !== '') {
            $existingBooking = Booking::query()
                ->where('booking_number', $requestedBookingNumber)
                ->where('tour_id', $tour->id)
                ->whereDate('departure_date', $requestedDepartureDate)
                ->first();

            if ($existingBooking) {
                $bookingNumber = $existingBooking->booking_number;
            }
        }

        $paidAmount = $existingBooking
            ? (float) $existingBooking->payments()->where('status', PaymentStatus::PAID->value)->sum('amount')
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
            'existingBooking' => $existingBooking?->load(['passengers', 'rooms']),
            'roomTypes' => [],
            'availability' => $availableSeats,
            'bookingSeatLimit' => $bookingSeatLimit,
            'addOns' => $addOns,
            'bookingDeadlineDays' => $deadlineDays,
            'bookingTimeLimitMinutes' => $bookingTimeLimitMinutes,
            'downPaymentAvailable' => $downPaymentAvailable,
            'minimumDownPaymentPct' => $minimumDownPaymentPct,
            'minimumVatPct' => (float) ($settings?->minimum_vat ?? BookingPricingService::DEFAULT_PPN_RATE),
            'platformFeePerPax' => app(BookingPricingService::class)->platformFeePerPax(),
            'vendorBankInfo' => [
                'bankName' => $paymentReceiverSettings?->manual_bank_transfer ?? '',
                'accountName' => $paymentReceiverSettings?->manual_bank_transfer_account_name ?? '',
                'accountNumber' => $paymentReceiverSettings?->manual_bank_transfer_account_number ?? '',
            ],
            'termConditions' => $settings?->term_conditions,
            'isResumingExistingBooking' => $existingBooking !== null,
            'reservedExpiresAt' => $existingBooking?->reserved_expires_at?->toIso8601String(),
            'remainingHoldSeconds' => $this->remainingHoldSeconds($existingBooking),
            'paidAmount' => $paidAmount,
            'remainingBalance' => $remainingBalance,
            'fullPaymentAvailable' => $fullPaymentAvailable,
            'paymentUnavailableReason' => $paymentUnavailableReason,
            'bookingPaymentResult' => null,
            'savedPassengers' => [],
            'customerOptions' => $this->customerOptionsForDashboardBooking($company),
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
        $agent = $this->dashboardAgent($company, $tour);
        $bookingTimeLimitMinutes = $this->resolveBookingTimeLimitMinutes($tour);

        $booking = DB::transaction(function () use ($request, $data, $tour, $owner, $agent, $bookingTimeLimitMinutes, $company, $bookingNumberService): Booking {
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
        $agent = $this->dashboardAgent($company, $tour);
        $owner = $this->resolveBookingOwner($request, $validated);
        $this->assertPaymentTypeAllowedForTour($tour, (string) $validated['payment_type']);

        $validated['booking_number'] = $this->resolveDashboardBookingNumber(data_get($validated, 'booking_number'), $company, $bookingNumberService);
        $this->transferDashboardPlaceholderOwnership((string) $validated['booking_number'], $request->user(), $owner);

        $validated['vendor_id'] = $tour->company_id;
        $validated['agent_id'] = $agent?->id;
        $validated['tour_id'] = $tour->id;

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

    public function updateTravelDocuments(Company $company, Booking $booking, Request $request): RedirectResponse
    {
        $this->assertCompanyCanAccessBooking($company, $booking);
        abort_unless(in_array($booking->status, [BookingStatus::DOWN_PAYMENT, BookingStatus::FULL_PAYMENT], true), 422);
        abort_unless($this->bookingNeedsTravelDocuments($booking->loadMissing('passengers')), 422);

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
            'proof' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ]);

        $this->assertDashboardCanStartPayment($booking, (float) $validated['transfer_amount'], (string) $validated['payment_type']);

        $payment = DB::transaction(function () use ($request, $booking, $validated): Payment {
            $paymentReceiver = app(BookingPaymentReceiverService::class)->resolveForBooking($booking);
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
                    'payment_type' => $validated['payment_type'],
                    'payment_receiver_type' => $paymentReceiver['receiver_type'],
                    'payment_receiver_company_id' => $paymentReceiver['receiver_company']?->id,
                    'partnership_payment_mode' => $paymentReceiver['payment_mode'],
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

        $this->assertDashboardCanStartPayment($booking, (float) $validated['amount'], (string) $validated['payment_type']);

        $payment = DB::transaction(function () use ($request, $booking, $validated): Payment {
            $paymentReceiver = app(BookingPaymentReceiverService::class)->resolveForBooking($booking);
            $payment = $booking->payments()->create([
                'owner_type' => get_class($request->user()),
                'owner_id' => $request->user()->id,
                'provider' => 'midtrans',
                'payment_method' => 'snap',
                'amount' => $validated['amount'],
                'status' => 'unpaid',
                'payload' => [
                    'payment_type' => $validated['payment_type'],
                    'payment_receiver_type' => $paymentReceiver['receiver_type'],
                    'payment_receiver_company_id' => $paymentReceiver['receiver_company']?->id,
                    'partnership_payment_mode' => $paymentReceiver['payment_mode'],
                ],
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
            ];
            $orderId = $params['transaction_details']['order_id'];

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
                    'payment_type' => $validated['payment_type'],
                    'order_id' => $orderId,
                    'snap_token' => $snapToken,
                    'request' => $params,
                    'payment_receiver_type' => $paymentReceiver['receiver_type'],
                    'payment_receiver_company_id' => $paymentReceiver['receiver_company']?->id,
                    'partnership_payment_mode' => $paymentReceiver['payment_mode'],
                ],
            ]);

            $booking->update([
                'status' => BookingStatus::BOOKING_RESERVED,
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
            if ($newStatus === PaymentStatus::PAID) {
                app(FinalizeBookingPaymentAction::class)
                    ->assertCanFinalizeIncomingPaidPayment($booking->fresh(), $payment->fresh());
            }

            $payment->update([
                'status' => $newStatus,
                'payload' => array_merge($payment->payload ?? [], $transactionStatus),
                'paid_at' => $newStatus === PaymentStatus::PAID ? now() : null,
            ]);

            if ($newStatus === PaymentStatus::PAID) {
                app(FinalizeBookingPaymentAction::class)->execute($booking->fresh(), $payment->fresh());
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
     * @return \Illuminate\Support\Collection<int, array{id: int, name: string, email: string, phone: string|null}>
     */
    private function customerOptionsForDashboardBooking(Company $company): \Illuminate\Support\Collection
    {
        $agentIds = $company->agentPartners()
            ->where('status', 'active')
            ->pluck('agent_id');

        return User::query()
            ->where(function ($query) use ($company, $agentIds): void {
                $query->where('company_id', $company->id)
                    ->when($agentIds->isNotEmpty(), function ($query) use ($agentIds): void {
                        $query->orWhereIn('company_id', $agentIds);
                    });
            })
            ->whereNotNull('email')
            ->orderBy('name')
            ->limit(50)
            ->get(['id', 'name', 'email', 'phone'])
            ->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
            ])
            ->values();
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

    private function tourPricesForSchedule(Tour $tour, ?TourSchedule $schedule): \Illuminate\Support\Collection
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
        if ($paymentType !== 'down_payment') {
            return;
        }

        $tour->loadMissing('company.companySetting');

        if ($this->minimumDownPaymentPct($tour->company?->companySetting?->minimum_down_payment) !== null) {
            return;
        }

        throw ValidationException::withMessages([
            'payment_type' => 'Down payment is unavailable for this tour. Please complete full payment.',
        ]);
    }

    private function assertPaymentTypeAllowedForBooking(Booking $booking, string $paymentType): void
    {
        if ($paymentType !== 'down_payment') {
            return;
        }

        $booking->loadMissing('vendor.companySetting');

        if ($this->minimumDownPaymentPct($booking->vendor?->companySetting?->minimum_down_payment) !== null) {
            return;
        }

        throw ValidationException::withMessages([
            'payment_type' => 'Down payment is unavailable for this tour. Please complete full payment.',
        ]);
    }

    private function assertDashboardCanStartPayment(Booking $booking, float $incomingAmount, string $paymentType): void
    {
        $this->assertPaymentTypeAllowedForBooking($booking, $paymentType);

        try {
            app(FinalizeBookingPaymentAction::class)->assertCanFinalizeIncomingAmount($booking->fresh(), $incomingAmount);
        } catch (ValidationException) {
            throw ValidationException::withMessages(['payment' => self::PAYMENT_UNAVAILABLE_MESSAGE]);
        }
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

    private function minimumDownPaymentPct(mixed $value): ?float
    {
        if (! is_numeric($value) || (float) $value <= 0) {
            return null;
        }

        return (float) $value;
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
        if ($booking->passengers->isEmpty()) {
            return false;
        }

        return $booking->passengers->contains(function ($passenger): bool {
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
        });
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

        $paidAmount = (float) $booking->payments()->where('status', PaymentStatus::PAID->value)->sum('amount');
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
