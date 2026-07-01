<?php

namespace App\Actions\Booking;

use App\Enums\BookingAvailabilityContext;
use App\Enums\BookingStatus;
use App\Enums\CompanyType;
use App\Models\Booking;
use App\Models\Company;
use App\Models\Tour;
use App\Models\TourAvailability;
use App\Models\TourSchedule;
use App\Models\TourWaitingListSchedule;
use App\Models\User;
use App\Services\BookingPricingService;
use App\Services\BookingRoomArrangementValidator;
use App\Services\BookingVisaTypeService;
use App\Support\TenantCustomerGuard;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReserveCustomerBookingAction
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function execute(User $user, Tour $tour, array $data, Company $company): Booking
    {
        TenantCustomerGuard::assertCustomerOfCompany($user, $company);

        if ($company->type === CompanyType::AGENT) {
            $data['agent_id'] = $company->id;
        }

        $tour->loadMissing('company.companySetting', 'visaCategory.items');

        $visaErrors = app(BookingVisaTypeService::class)
            ->validationErrorsForPassengers($tour, $data['passengers'] ?? []);

        if ($visaErrors !== []) {
            throw ValidationException::withMessages($visaErrors);
        }

        if (! $this->resolveBookableSchedule($tour, (string) $data['departure_date'])) {
            throw ValidationException::withMessages([
                'departure_date' => 'Booking window closed.',
            ]);
        }

        app(BookingRoomArrangementValidator::class)->validatePassengerMix($data['passengers'] ?? []);

        $bookingTimeLimitMinutes = $this->resolveBookingTimeLimitMinutes($tour);

        return DB::transaction(function () use ($data, $tour, $bookingTimeLimitMinutes, $user): Booking {
            $vendorId = (int) ($data['vendor_id'] ?? $tour->company_id);
            $existingBooking = Booking::query()
                ->where('booking_number', $data['booking_number'])
                ->where('user_id', $user->id)
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

            if (! $availability) {
                throw ValidationException::withMessages([
                    'availability' => BookingAvailabilityContext::Reserve->message(),
                ]);
            }

            $requestedSeatCount = (int) $data['pax_adult']
                + (int) $data['pax_child'];

            app(AssertScheduleSeatAvailabilityAction::class)->assertWithLockedAvailability(
                $availability,
                $tour->id,
                $vendorId,
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
                ! empty($data['agent_id']),
                ! empty($data['agent_id']) ? (int) $data['agent_id'] : null,
            );
            $totals = app(BookingPricingService::class)->bookingTotalsFromQuote($quote);

            $reservedExpiresAt = $existingBooking?->status === BookingStatus::BOOKING_RESERVED
                && $existingBooking->reserved_expires_at
                && $existingBooking->reserved_expires_at->isFuture()
                    ? $existingBooking->reserved_expires_at
                    : now()->addMinutes($bookingTimeLimitMinutes);

            $reservedType = $existingBooking && $this->isWaitingListOfferBooking($existingBooking)
                ? 'waiting_list_offer'
                : 'system';

            $booking = Booking::updateOrCreate(
                [
                    'booking_number' => $data['booking_number'],
                    'user_id' => $user->id,
                ],
                [
                    'tour_id' => $data['tour_id'],
                    'departure_date' => $data['departure_date'],
                    'pax_adult' => $data['pax_adult'],
                    'pax_child' => $data['pax_child'],
                    'pax_infant' => $data['pax_infant'],
                    'status' => BookingStatus::BOOKING_RESERVED,
                    'reserved_type' => $reservedType,
                    'reserved_expires_at' => $reservedExpiresAt,
                    'vendor_id' => $vendorId,
                    'agent_id' => $data['agent_id'] ?? null,
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
                    'input_by_user_id' => $user->id,
                    'input_by_company_id' => null,
                    'input_by_role' => 'customer',
                ]
            );

            if (! empty($data['passengers'])) {
                $booking->passengers()->delete();
                $booking->passengers()->createMany($quote['passengers']);
            }

            $booking->rooms()->delete();

            $booking->addons()->delete();
            if (! empty($quote['addons'])) {
                $booking->addons()->createMany($quote['addons']);
            }

            app(SyncAvailabilityAction::class)->syncSchedule($schedule, $vendorId);

            return $booking->fresh(['tour']);
        });
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

    private function resolveBookingTimeLimitMinutes(Tour $tour): int
    {
        $tour->loadMissing('company.companySetting');

        $minutes = (int) ($tour->company?->companySetting?->booking_entry_time_limit ?? 0);

        return $minutes > 0 ? $minutes : 10;
    }

    private function normalizeDateString(\DateTimeInterface|string|null $date): ?string
    {
        if ($date === null) {
            return null;
        }

        if ($date instanceof \DateTimeInterface) {
            return Carbon::instance($date)->toDateString();
        }

        return Carbon::parse($date)->toDateString();
    }
}
