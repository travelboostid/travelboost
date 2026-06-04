<?php

namespace App\Http\Controllers\Me;

use App\Actions\Booking\ExpireBookingReservationsAction;
use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\Booking;
use App\Models\Company;
use App\Models\Payment;
use App\Models\Tour;
use App\Models\TourAvailability;
use App\Models\TourPrice;
use App\Models\TourSchedule;
use App\Services\BookingPaymentReceiverService;
use App\Services\BookingPaymentWorkflowService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function show()
    {
        return Inertia::render('me/home');
    }

    public function bookings(Request $request): Response
    {
        $user = $request->user();
        $tab = $request->string('tab')->toString();
        $activeTab = in_array($tab, ['favorites', 'current', 'history'], true)
          ? $tab
          : 'current';

        if (! $user) {
            return Inertia::render('me/bookings', [
                'bookings' => null,
                'favorites' => null,
                'activeTab' => $activeTab,
                'selectedBookingNumber' => $request->string('booking_number')->toString() ?: null,
            ]);
        }

        app(ExpireBookingReservationsAction::class)->execute();

        $currentStatuses = [
            BookingStatus::AWAITING_PAYMENT->value,
            BookingStatus::WAITING_PAYMENT_APPROVAL->value,
            BookingStatus::DOWN_PAYMENT->value,
            BookingStatus::FULL_PAYMENT->value,
            BookingStatus::RESERVED->value,
            BookingStatus::BOOKING_RESERVED->value,
            BookingStatus::EXPIRED->value,
            BookingStatus::WAITING_LIST->value,
        ];

        $bookings = $activeTab !== 'favorites'
          ? $user->bookings()
              ->with([
                  'tour.image',
                  'tour.document',
                  'tour.company.companySetting',
                  'tour.company.settings',
                  'vendor',
                  'passengers',
                  'payments',
              ])
              ->when($activeTab === 'current', function ($query) use ($currentStatuses): void {
                  $query
                      ->whereIn('status', $currentStatuses)
                      ->where(function ($query): void {
                          $query
                              ->whereNull('departure_date')
                              ->orWhereDate('departure_date', '>=', now()->toDateString());
                      });
              })
              ->when($activeTab === 'history', function ($query): void {
                  $query->where(function ($query): void {
                      $query
                          ->whereDate('departure_date', '<', now()->toDateString())
                          ->orWhereIn('status', [
                              BookingStatus::CANCELLED->value,
                              BookingStatus::REFUNDED->value,
                          ]);
                  });
              })
              ->latest()
              ->paginate(10)
              ->withQueryString()
              ->through(fn (Booking $booking): array => $this->appendBookingPayload($booking))
          : null;

        $favorites = $activeTab === 'favorites'
          ? $user->likedTours()
              ->with(['company.companySetting', 'image'])
              ->latest('tour_likes.created_at')
              ->paginate(10)
              ->withQueryString()
          : null;

        if ($favorites) {
            $this->appendSchedulePayload($favorites->getCollection());
        }

        return Inertia::render('me/bookings', [
            'bookings' => $bookings,
            'favorites' => $favorites,
            'activeTab' => $activeTab,
            'selectedBookingNumber' => $request->string('booking_number')->toString() ?: null,
        ]);
    }

    public function bookingInvoice(Request $request, Booking $booking): HttpResponse
    {
        abort_unless($request->user()?->id === $booking->user_id, 403);

        $booking->load([
            'user',
            'agent.photo',
            'vendor.companySetting',
            'tour.company.companySetting',
            'passengers',
            'addons',
            'payments',
        ]);

        $paidPayments = app(BookingPaymentWorkflowService::class)
            ->finalizablePaidPayments($booking)
            ->sortBy(fn (Payment $payment): string => (string) ($payment->paid_at ?? $payment->created_at))
            ->values();

        abort_if($paidPayments->isEmpty(), 404);

        $paymentDate = $paidPayments->last()?->paid_at ?? $paidPayments->last()?->created_at;
        $paymentReceiver = app(BookingPaymentReceiverService::class)->resolveForBooking($booking);
        $agent = $paymentReceiver['receiver_company'] ?? $booking->vendor ?? $booking->tour?->company;
        $invoiceSchedule = $this->resolveInvoiceSchedule($booking);
        $priceBreakdown = $this->buildInvoicePriceBreakdown($booking);
        $paymentDetails = $this->buildInvoicePaymentDetails($booking);
        $paymentDetailsTotal = (float) collect($paymentDetails)->sum('amount');
        $otherChargeAmount = (float) $booking->platform_fee;
        $vatRate = $this->resolveInvoiceVatRate($booking);
        $isProforma = $booking->status === BookingStatus::DOWN_PAYMENT;
        $settings = $booking->vendor?->companySetting ?? $booking->tour?->company?->companySetting;
        $dueDate = $this->buildDeadlinePayload($booking->departure_date, $settings?->full_payment_deadline)['date'] ?? null;

        $filename = 'Invoice_'.$booking->booking_number.'.pdf';

        $pdf = Pdf::setOption(['isRemoteEnabled' => true])
            ->loadView('exports.booking-invoice', [
                'booking' => $booking,
                'agent' => $agent,
                'logoSrc' => $this->resolveCompanyLogoSrc($agent),
                'customerName' => $booking->contact_name ?: $booking->user?->name,
                'billedToName' => $booking->contact_name ?: $booking->user?->name,
                'billedToEmail' => $booking->contact_email ?: $booking->user?->email,
                'billedToPhone' => $booking->contact_phone ?: $booking->user?->phone,
                'billedToAddress' => null,
                'paymentDate' => $paymentDate,
                'invoiceDate' => $booking->created_at,
                'dueDate' => $dueDate,
                'returnDate' => $invoiceSchedule?->return_date,
                'paidAmount' => (float) $paidPayments->sum('amount'),
                'priceBreakdown' => $priceBreakdown,
                'paymentDetails' => $paymentDetails,
                'paymentDetailsTotal' => $paymentDetailsTotal,
                'vatRate' => $vatRate,
                'otherChargeAmount' => $otherChargeAmount,
                'discountAmount' => 0,
                'isProforma' => $isProforma,
                'paymentInstructions' => $isProforma
                    ? $this->proformaPaymentInstructions($agent)
                    : [],
            ])
            ->setPaper('A4', 'portrait');

        return $pdf->stream($filename);
    }

    /**
     * @return array<string, mixed>
     */
    private function appendBookingPayload(Booking $booking): array
    {
        $paidAmount = app(BookingPaymentWorkflowService::class)->finalizablePaidAmount($booking);
        $grandTotal = (float) $booking->grand_total;
        $remainingBalance = max(0.0, $grandTotal - $paidAmount);
        $status = $booking->status instanceof BookingStatus
            ? $booking->status
            : BookingStatus::tryFrom((string) $booking->status);
        $isDownPayment = $status === BookingStatus::DOWN_PAYMENT;
        $needsTravelDocuments = in_array($status, [
            BookingStatus::WAITING_PAYMENT_APPROVAL,
            BookingStatus::DOWN_PAYMENT,
            BookingStatus::FULL_PAYMENT,
        ], true) && $this->bookingNeedsTravelDocuments($booking);

        $company = $booking->tour?->company;
        $settings = $company?->companySetting ?? $company?->settings ?? $company?->settings()->first();
        $actionEligibility = $this->resolveActionEligibility($booking, $status, $settings);

        return [
            ...$booking->toArray(),
            'paid_amount' => $paidAmount,
            'remaining_balance' => $remainingBalance,
            'display_amount_label' => $isDownPayment ? 'Remaining balance' : 'Grand total',
            'display_amount' => $isDownPayment ? $remainingBalance : $grandTotal,
            'needs_travel_documents' => $needsTravelDocuments,
            'payment_deadline' => $this->buildDeadlinePayload($booking->departure_date, $settings?->full_payment_deadline),
            'document_deadline' => $this->buildDeadlinePayload($booking->departure_date, $settings?->document_completed_deadline),
            'document_url' => $this->buildDocumentUrl($booking),
            ...$actionEligibility,
        ];
    }

    private function resolveActionEligibility(Booking $booking, ?BookingStatus $status, mixed $settings): array
    {
        $canContinueBooking = in_array($status, [
            BookingStatus::AWAITING_PAYMENT,
            BookingStatus::BOOKING_RESERVED,
        ], true);
        $canReorder = $status === BookingStatus::EXPIRED;

        if (! $canContinueBooking && ! $canReorder) {
            return [
                'can_continue_booking' => false,
                'can_reorder' => false,
                'booking_window_closed' => false,
                'action_unavailable_reason' => null,
            ];
        }

        $isBookable = $this->bookingScheduleIsBookable($booking, $settings);

        return [
            'can_continue_booking' => $canContinueBooking && $isBookable,
            'can_reorder' => $canReorder && $isBookable,
            'booking_window_closed' => ! $isBookable,
            'action_unavailable_reason' => $isBookable ? null : 'Booking window closed',
        ];
    }

    private function bookingScheduleIsBookable(Booking $booking, mixed $settings): bool
    {
        if (! $booking->tour_id || ! $booking->vendor_id || ! $booking->departure_date) {
            return false;
        }

        $departureDate = Carbon::parse($booking->departure_date)->startOfDay();
        $deadlineDays = (int) ($settings?->booking_deadline ?? 0);
        $cutoffDate = now()->startOfDay()->addDays($deadlineDays);

        if ($departureDate->lt($cutoffDate)) {
            return false;
        }

        return TourSchedule::query()
            ->where('tour_id', $booking->tour_id)
            ->where('company_id', $booking->vendor_id)
            ->where('is_active', true)
            ->whereDate('departure_date', $departureDate->toDateString())
            ->exists();
    }

    private function bookingNeedsTravelDocuments(Booking $booking): bool
    {
        if ($booking->passengers->isEmpty()) {
            return false;
        }

        return $booking->passengers->contains(fn ($passenger): bool => blank($passenger->passport_number)
            || blank($passenger->passport_issue_date)
            || blank($passenger->passport_expiry_date)
            || blank($passenger->passport_file_path)
            || blank($passenger->visa_number)
            || blank($passenger->visa_file_path));
    }

    private function buildDeadlinePayload(mixed $departureDate, mixed $daysBefore): ?array
    {
        if (! $departureDate || $daysBefore === null) {
            return null;
        }

        $deadline = Carbon::parse($departureDate)
            ->startOfDay()
            ->subDays(max(0, (int) $daysBefore));
        $daysRemaining = (int) now()->startOfDay()->diffInDays($deadline, false);

        return [
            'date' => $deadline->toDateString(),
            'days_before_departure' => (int) $daysBefore,
            'days_remaining' => $daysRemaining,
            'is_overdue' => $daysRemaining < 0,
        ];
    }

    private function buildDocumentUrl(Booking $booking): ?string
    {
        if (! $booking->tour?->document || ! $booking->tour?->company?->username) {
            return null;
        }

        return "/brochure/{$booking->tour->company->username}/{$booking->tour->id}";
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
     * @return list<array{label: string, value: string}>
     */
    private function proformaPaymentInstructions(mixed $issuer): array
    {
        $recipient = $issuer?->name ?: 'the issuing company';
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
                'value' => 'Customer must complete the remaining balance according to the agreed payment method.',
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

    /**
     * @param  Collection<int, Tour>  $tours
     */
    private function appendSchedulePayload(Collection $tours): void
    {
        if ($tours->isEmpty()) {
            return;
        }

        $tourCompanyMap = $tours->mapWithKeys(fn (Tour $tour): array => [
            $tour->id => $tour->company_id,
        ]);

        $availabilities = TourAvailability::query()
            ->whereIn('tour_id', $tourCompanyMap->keys())
            ->with('schedule')
            ->get()
            ->filter(fn (TourAvailability $availability): bool => $availability->schedule !== null
                && (int) $availability->company_id === (int) $tourCompanyMap->get($availability->tour_id))
            ->groupBy('tour_id');

        $tours->each(function (Tour $tour) use ($availabilities): void {
            $deadlineDays = (int) ($tour->company?->companySetting?->booking_deadline ?? 0);
            $cutoffDate = now()->addDays($deadlineDays)->toDateString();

            $tour->setAttribute(
                'schedules',
                $availabilities
                    ->get($tour->id, collect())
                    ->filter(fn (TourAvailability $availability): bool => $availability->schedule->departure_date >= $cutoffDate)
                    ->map(fn (TourAvailability $availability): array => [
                        'id' => $availability->schedule->id,
                        'tour_id' => $availability->schedule->tour_id,
                        'departure_date' => $availability->schedule->departure_date,
                        'return_date' => $availability->schedule->return_date,
                        'quota' => (int) $availability->available,
                        'price' => (float) ($tour->showprice ?? 0),
                        'agent_price' => 0,
                        'cutoff_date' => $availability->schedule->cutoff_date,
                        'is_active' => (bool) $availability->schedule->is_active,
                        'note' => $availability->schedule->note,
                        'booking_deadline_days' => $deadlineDays,
                        'availability' => [
                            'available' => (int) $availability->available,
                            'max_pax' => (int) $availability->max_pax,
                        ],
                    ])
                    ->values()
            );
        });
    }

    public function toggleTourLike(Request $request, Tour $tour): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 403);

        $existing = $user->tourLikes()->where('tour_id', $tour->id)->first();

        if ($existing) {
            $existing->delete();

            return response()->json(['liked' => false]);
        }

        $user->tourLikes()->create(['tour_id' => $tour->id]);

        return response()->json(['liked' => true]);
    }
}
