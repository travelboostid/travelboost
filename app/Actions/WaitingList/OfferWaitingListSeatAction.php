<?php

namespace App\Actions\WaitingList;

use App\Actions\Booking\SyncAvailabilityAction;
use App\Enums\BookingStatus;
use App\Enums\TourWaitingListScheduleStatus;
use App\Enums\TourWaitingListStatus;
use App\Jobs\SendWaitingListOfferNotificationJob;
use App\Models\Booking;
use App\Models\TourAvailability;
use App\Models\TourWaitingListSchedule;
use App\Services\BookingNumberService;
use App\Support\WaitingListBookingDeadline;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OfferWaitingListSeatAction
{
    public function execute(TourWaitingListSchedule $schedule): TourWaitingListSchedule
    {
        return DB::transaction(function () use ($schedule): TourWaitingListSchedule {
            $schedule = TourWaitingListSchedule::query()
                ->whereKey($schedule->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($schedule->status !== TourWaitingListScheduleStatus::QUEUED) {
                throw ValidationException::withMessages([
                    'schedule' => 'Only queued waiting-list schedules can receive an offer.',
                ]);
            }

            $waitingList = $schedule->waitingList()->lockForUpdate()->firstOrFail();
            $tourSchedule = $schedule->tourSchedule()->firstOrFail();
            $tour = $waitingList->tour()->firstOrFail();

            if (WaitingListBookingDeadline::isPastDeadline($tourSchedule, $tour)) {
                throw ValidationException::withMessages([
                    'schedule' => 'This departure has passed the booking deadline and can no longer receive offers.',
                ]);
            }

            $requiredSeats = (int) $schedule->pax_adult + (int) $schedule->pax_child;

            if ($requiredSeats <= 0) {
                throw ValidationException::withMessages([
                    'schedule' => 'Waiting-list schedule must include at least one paying guest.',
                ]);
            }

            if ($waitingList->customer_user_id === null) {
                throw ValidationException::withMessages([
                    'schedule' => 'A linked customer account is required before sending a seat offer.',
                ]);
            }

            $availability = TourAvailability::query()
                ->where('company_id', $waitingList->vendor_id)
                ->where('tour_id', $waitingList->tour_id)
                ->where('schedule_id', $schedule->tour_schedule_id)
                ->lockForUpdate()
                ->first();

            if (! $availability || (int) $availability->available < $requiredSeats) {
                throw ValidationException::withMessages([
                    'availability' => 'Not enough seats are available to offer this waiting-list request.',
                ]);
            }

            $agentCompanyId = $waitingList->agent_company_id;
            $bookingNumber = app(BookingNumberService::class)->generate(
                (string) ($agentCompanyId ?? $waitingList->vendor_id)
            );

            $offerHours = (int) config('waiting-list.offer_hours', 24);
            $expiresAt = now()->addHours($offerHours);

            $booking = Booking::query()->create([
                'booking_number' => $bookingNumber,
                'user_id' => $waitingList->customer_user_id,
                'tour_id' => $waitingList->tour_id,
                'departure_date' => $tourSchedule->departure_date,
                'vendor_id' => $waitingList->vendor_id,
                'agent_id' => $agentCompanyId,
                'pax_adult' => $schedule->pax_adult,
                'pax_child' => $schedule->pax_child,
                'pax_infant' => $schedule->pax_infant,
                'status' => BookingStatus::BOOKING_RESERVED,
                'reserved_type' => 'waiting_list_offer',
                'reserved_expires_at' => $expiresAt,
                'contact_name' => $waitingList->contact_name,
                'contact_email' => $waitingList->contact_email,
                'contact_phone' => $waitingList->contact_phone,
                'total_price' => 0,
                'tax_rate' => 0,
                'tax_amount' => 0,
                'platform_fee' => 0,
                'commission_amount' => 0,
                'grand_total' => 0,
                'input_by_user_id' => $waitingList->customer_user_id,
                'input_by_role' => 'customer',
            ]);

            app(SyncAvailabilityAction::class)->executeForBooking($booking);

            $schedule->update([
                'status' => TourWaitingListScheduleStatus::OFFERED,
                'offered_at' => now(),
                'offer_expires_at' => $expiresAt,
                'offered_seats' => $requiredSeats,
                'booking_id' => $booking->id,
            ]);

            if (! in_array($waitingList->status, [
                TourWaitingListStatus::OFFERED,
                TourWaitingListStatus::FULFILLED,
            ], true)) {
                $waitingList->update([
                    'status' => TourWaitingListStatus::OFFERED,
                ]);
            }

            SendWaitingListOfferNotificationJob::dispatch(
                $schedule->fresh(['waitingList.tour', 'tourSchedule', 'booking']),
                $booking->fresh(),
            )->afterCommit();

            return $schedule->fresh(['waitingList', 'tourSchedule', 'booking']);
        });
    }
}
