<?php

namespace App\Http\Controllers;

use App\Actions\Booking\ExpireBookingReservationsAction;
use App\Actions\Booking\FinalizeBookingPaymentAction;
use App\Actions\Booking\SyncAvailabilityAction;
use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Http\Requests\StoreBookingRequest;
use App\Models\Booking;
use App\Models\BookingDocument;
use App\Models\Payment;
use App\Models\Tour;
use App\Models\TourPrice;
use App\Services\BookingNumberService;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Midtrans\Snap;
use Midtrans\Transaction;

class BookingController extends Controller
{
    /**
     * Show the form for creating a new booking.
     */
    public function create(string $username, Tour $tour, BookingNumberService $bookingNumberService): Response
    {
        $tour->load('company.companySetting', 'schedules.availability');
        $settings = $tour->company?->companySetting;
        $deadlineDays = (int) ($settings?->booking_deadline ?? 0);
        $bookingTimeLimitMinutes = $this->resolveBookingTimeLimitMinutes($tour);
        $minimumDownPaymentPct = (float) ($settings?->minimum_down_payment ?: 50);
        $cutoffDate = now()->addDays($deadlineDays)->toDateString();

        $tenant = request()->attributes->get('tenant');
        $companyId = $tenant?->id ?? 0;
        $agentCode = $tenant?->username ?? 'AGT';
        $tourCode = $tour->code ?? 'TOUR';

        $schedule = null;
        $availableSeats = 0;
        if (request()->query('date')) {
            $schedule = \App\Models\TourSchedule::where('tour_code', $tour->code)
                ->whereDate('departure_date', request()->query('date'))
                ->first();

            if ($schedule && $schedule->departure_date < $cutoffDate) {
                $schedule = null;
            }

            if ($schedule) {
                app(ExpireBookingReservationsAction::class)->execute($tour->company, $tour->id);

                $availability = \App\Models\TourAvailability::where('schedule_id', $schedule->id)
                    ->where('tour_id', $tour->id)
                    ->first();

                $availableSeats = $availability ? (int) $availability->available : 0;

                $addOns = \App\Models\TourAddOn::where('schedule_id', $schedule->id)
                    ->where('tour_id', $tour->id)
                    ->get()
                    ->map(function ($addon) {
                        return [
                            'key' => 'addon_'.$addon->id,
                            'label' => $addon->description,
                            'unitPrice' => (float) $addon->price,
                            'qty' => $addon->edit_status ? 0 : 1,
                            'hasQty' => (bool) $addon->edit_status,
                        ];
                    })->values()->toArray();
            } else {
                $addOns = [];
            }
        } else {
            $addOns = [];
        }

        $bookingNumber = $bookingNumberService->generate((string) $companyId);
        $user = request()->user();
        $existingBooking = null;
        $isResumingExistingBooking = false;

        if ($user && $schedule) {
            $existingBooking = Booking::with('passengers')
                ->where('user_id', $user->id)
                ->where('tour_id', $tour->id)
                ->whereIn('status', [
                    BookingStatus::AWAITING_PAYMENT,
                    BookingStatus::BOOKING_RESERVED,
                    BookingStatus::WAITING_PAYMENT_APPROVAL,
                    BookingStatus::RESERVED,
                ])
                ->whereDate('departure_date', request()->query('date'))
                ->latest()
                ->first();

            if ($existingBooking) {
                $bookingNumber = $existingBooking->booking_number;
                $isResumingExistingBooking = true;
            } else {
                $existingBooking = Booking::create([
                    'booking_number' => $bookingNumber,
                    'user_id' => $user->id,
                    'tour_id' => $tour->id,
                    'departure_date' => request()->query('date'),
                    'pax_adult' => 1,
                    'pax_child' => 0,
                    'pax_infant' => 0,
                    'status' => BookingStatus::AWAITING_PAYMENT,
                    'reserved_type' => 'system',
                    'vendor_id' => $tour->company_id,
                    'agent_id' => $tenant?->id ?? null,
                    'total_price' => 0,
                    'tax_amount' => 0,
                    'platform_fee' => 0,
                    'commission_amount' => 0,
                    'grand_total' => 0,
                    'contact_name' => $user->name ?? null,
                    'contact_email' => $user->email ?? null,
                ]);
            }
        }

        $tour->setRelation(
            'schedules',
            $tour->schedules
                ->filter(fn ($tourSchedule) => $tourSchedule->departure_date >= $cutoffDate)
                ->values()
        );

        return Inertia::render('tours/bookings/create', [
            'tour' => $tour,
            'tourPrices' => TourPrice::with('priceCategory:id,name,description')
                ->where('tour_code', $tour->code)
                ->when($schedule, function ($query) use ($schedule) {
                    $query->where('schedule_id', $schedule->id);
                })
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
            'addOns' => $addOns,
            'bookingDeadlineDays' => $deadlineDays,
            'bookingTimeLimitMinutes' => $bookingTimeLimitMinutes,
            'minimumDownPaymentPct' => $minimumDownPaymentPct,
            'minimumVatPct' => (float) ($settings?->minimum_vat ?? 11),
            'vendorBankInfo' => [
                'bankName' => $settings?->manual_bank_transfer ?? '',
                'accountName' => $settings?->manual_bank_transfer_account_name ?? '',
                'accountNumber' => $settings?->manual_bank_transfer_account_number ?? '',
            ],
            'termConditions' => $settings?->term_conditions,
            'isResumingExistingBooking' => $isResumingExistingBooking,
            'reservedExpiresAt' => $existingBooking?->reserved_expires_at?->toIso8601String(),
            'remainingHoldSeconds' => $this->remainingHoldSeconds($existingBooking),
        ]);
    }

    /**
     * Store a newly created booking.
     */
    public function store(string $username, StoreBookingRequest $request, BookingService $bookingService): RedirectResponse
    {
        try {
            $validated = $request->validated();
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

    /**
     * Reserve a booking (set status to 'booking reserved' when entering step 2).
     */
    public function reserve(string $username, Tour $tour): RedirectResponse
    {
        $data = request()->validate([
            'tour_id' => ['required', 'exists:tours,id'],
            'departure_date' => ['required', 'date'],
            'pax_adult' => ['required', 'integer', 'min:1'],
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
            'passengers' => ['nullable', 'array'],
            'passengers.*.title' => ['nullable', 'string', 'max:20'],
            'passengers.*.first_name' => ['required_with:passengers', 'string', 'max:255'],
            'passengers.*.last_name' => ['nullable', 'string', 'max:255'],
            'passengers.*.dob' => ['nullable', 'date'],
            'passengers.*.pob' => ['nullable', 'string', 'max:255'],
            'passengers.*.price_category' => ['nullable', 'string'],
            'passengers.*.price_amount' => ['nullable', 'numeric'],
            'passengers.*.room_type' => ['nullable', 'string'],
            'passengers.*.note' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->validateExtraBedPassengers($data['passengers'] ?? []);

        $bookingTimeLimitMinutes = $this->resolveBookingTimeLimitMinutes($tour);

        $booking = \Illuminate\Support\Facades\DB::transaction(function () use ($data, $tour, $bookingTimeLimitMinutes) {
            $existingBooking = Booking::query()
                ->where('booking_number', $data['booking_number'])
                ->where('user_id', request()->user()->id)
                ->lockForUpdate()
                ->first();

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
                    'vendor_id' => $data['vendor_id'] ?? $tour->company_id,
                    'agent_id' => $data['agent_id'] ?? null,
                    'total_price' => $data['total_price'] ?? 0,
                    'tax_amount' => $data['tax_amount'] ?? 0,
                    'platform_fee' => $data['platform_fee'] ?? 0,
                    'commission_amount' => $data['commission_amount'] ?? 0,
                    'grand_total' => $data['grand_total'] ?? 0,
                    'contact_name' => $data['contact_name'] ?? null,
                    'contact_email' => $data['contact_email'] ?? null,
                    'contact_phone' => $data['contact_phone'] ?? null,
                    'contact_notes' => $data['contact_notes'] ?? null,
                ]
            );

            if (! empty($data['passengers'])) {
                $booking->passengers()->delete();
                $booking->passengers()->createMany($data['passengers']);
            }

            return $booking;
        });

        app(SyncAvailabilityAction::class)->executeForBooking($booking->fresh());

        return back();
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
            'proof' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ]);

        DB::transaction(function () use ($request, $booking, $validated): void {
            $proof = $request->file('proof');
            $path = $proof->store('payment-proofs', 'public');

            $booking->payments()->create([
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
        });

        app(SyncAvailabilityAction::class)->executeForBooking($booking->fresh());

        return back()->with('success', 'Payment proof submitted. We will verify shortly.');
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

        $payment = DB::transaction(function () use ($request, $booking, $validated) {
            $payment = $booking->payments()->create([
                'owner_type' => get_class($request->user()),
                'owner_id' => $request->user()->id,
                'provider' => 'midtrans',
                'payment_method' => 'snap',
                'amount' => $validated['amount'],
                'status' => 'unpaid',
                'payload' => [
                    'payment_type' => $validated['payment_type'],
                ],
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
            ];

            $snapToken = Snap::getSnapToken($params);
            $orderId = $params['transaction_details']['order_id'];

            $payment->update([
                'status' => 'pending',
                'payload' => [
                    'payment_type' => $validated['payment_type'],
                    'order_id' => $orderId,
                    'snap_token' => $snapToken,
                    'request' => $params,
                ],
            ]);

            $booking->update([
                'status' => BookingStatus::BOOKING_RESERVED,
                'payment_mode' => 'online',
            ]);

            return $payment;
        });

        app(SyncAvailabilityAction::class)->executeForBooking($booking->fresh());

        return response()->json([
            'payment' => [
                'id' => $payment->id,
                'payload' => $payment->payload,
            ],
        ]);
    }

    public function confirmOnlinePayment(
        Request $request,
        Booking $booking,
        Payment $payment
    ): JsonResponse {
        abort_unless($request->user()?->id === $booking->user_id, 403);
        $booking = $this->ensureBookingNotExpired($booking);
        abort_unless($payment->payable_type === Booking::class, 404);
        abort_unless((int) $payment->payable_id === (int) $booking->id, 404);
        abort_unless($payment->provider === 'midtrans', 422);

        $orderId = data_get($payment->payload, 'order_id')
            ?? data_get($payment->payload, 'request.transaction_details.order_id');

        abort_unless(is_string($orderId) && $orderId !== '', 422);

        $transactionStatus = (array) Transaction::status($orderId);
        $newStatus = $this->mapMidtransStatus($transactionStatus['transaction_status'] ?? 'pending');

        DB::transaction(function () use ($booking, $payment, $transactionStatus, $newStatus): void {
            $payment->update([
                'status' => $newStatus,
                'payload' => array_merge($payment->payload ?? [], $transactionStatus),
                'paid_at' => $newStatus === PaymentStatus::PAID ? now() : null,
            ]);

            if ($newStatus === PaymentStatus::PAID) {
                app(FinalizeBookingPaymentAction::class)->execute($booking->fresh());
            }
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

    /**
     * @param  array<int, array<string, mixed>>  $passengers
     */
    private function validateExtraBedPassengers(array $passengers): void
    {
        $extraBedPassengers = collect($passengers)->filter(function (array $passenger): bool {
            return str_contains(strtolower((string) ($passenger['price_category'] ?? '')), 'extra bed');
        });

        if ($extraBedPassengers->isEmpty()) {
            return;
        }

        $hasBaseRoom = collect($passengers)->contains(function (array $passenger): bool {
            $priceCategory = strtolower((string) ($passenger['price_category'] ?? ''));
            $roomType = strtolower((string) ($passenger['room_type'] ?? ''));

            return ! str_contains($priceCategory, 'extra bed')
                && (str_contains($roomType, 'twin') || str_contains($roomType, 'double'));
        });

        if (! $hasBaseRoom) {
            throw ValidationException::withMessages([
                'passengers' => '"Extra Bed" can only be added with an Adult Twin or Adult Double room.',
            ]);
        }
    }
}
