<?php

namespace App\Http\Controllers\Me;

use App\Actions\Booking\ExpireBookingReservationsAction;
use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Tour;
use App\Models\TourAvailability;
use App\Models\TourSchedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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

    /**
     * @return array<string, mixed>
     */
    private function appendBookingPayload(Booking $booking): array
    {
        $paidAmount = (float) $booking->payments
            ->where('status', PaymentStatus::PAID)
            ->sum('amount');
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

    /**
     * @param  \Illuminate\Support\Collection<int, \App\Models\Tour>  $tours
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
