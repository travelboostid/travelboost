<?php

namespace App\Actions\WaitingList;

use App\Enums\TourWaitingListScheduleStatus;
use App\Enums\TourWaitingListStatus;
use App\Models\TourAvailability;
use App\Models\TourWaitingList;
use App\Models\TourWaitingListSchedule;
use App\Models\User;
use App\Support\WaitingListSchedulePaxValidator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UpdateCustomerTourWaitingListAction
{
    /**
     * @param  array{
     *     schedules: list<array{
     *         id: int,
     *         pax_adult: int,
     *         pax_child: int,
     *         pax_infant: int
     *     }>,
     *     contact_name: string,
     *     contact_phone: string,
     *     contact_email: string,
     *     contact_address?: string|null
     * }  $data
     */
    public function execute(User $customer, TourWaitingList $waitingList, array $data): TourWaitingList
    {
        return DB::transaction(function () use ($customer, $waitingList, $data): TourWaitingList {
            $waitingList = TourWaitingList::query()
                ->whereKey($waitingList->id)
                ->lockForUpdate()
                ->with(['schedules.tourSchedule', 'tour.company.companySetting'])
                ->firstOrFail();

            $this->assertCustomerCanManage($customer, $waitingList);

            $tour = $waitingList->tour;
            if (! $tour) {
                throw ValidationException::withMessages([
                    'waiting_list' => 'The tour for this waiting-list request is unavailable.',
                ]);
            }

            $waitingList->update([
                'contact_name' => trim($data['contact_name']),
                'contact_phone' => trim($data['contact_phone']),
                'contact_email' => mb_strtolower(trim($data['contact_email'])),
                'contact_address' => filled($data['contact_address'] ?? null)
                    ? trim((string) $data['contact_address'])
                    : null,
            ]);

            $scheduleUpdates = collect($data['schedules'])->keyBy('id');
            $queuedSchedules = $waitingList->schedules
                ->filter(fn (TourWaitingListSchedule $schedule): bool => $schedule->status === TourWaitingListScheduleStatus::QUEUED)
                ->values();

            $availabilities = TourAvailability::query()
                ->whereIn('schedule_id', $queuedSchedules->pluck('tour_schedule_id'))
                ->lockForUpdate()
                ->get()
                ->keyBy('schedule_id');

            $queuedSchedules->each(function (TourWaitingListSchedule $schedule, int $index) use (
                $scheduleUpdates,
                $tour,
                $availabilities,
            ): void {
                $update = $scheduleUpdates->get($schedule->id);

                if (! is_array($update)) {
                    throw ValidationException::withMessages([
                        'schedules' => 'Each queued departure must be included in the update.',
                    ]);
                }

                $tourSchedule = $schedule->tourSchedule;
                $availability = $tourSchedule
                    ? $availabilities->get($tourSchedule->id)
                    : null;

                if (! $tourSchedule || ! $availability) {
                    throw ValidationException::withMessages([
                        "schedules.{$index}.id" => 'Seat availability is unavailable for this schedule.',
                    ]);
                }

                WaitingListSchedulePaxValidator::validateForWaitingList(
                    tour: $tour,
                    schedule: $tourSchedule,
                    availability: $availability,
                    pax: [
                        'pax_adult' => (int) $update['pax_adult'],
                        'pax_child' => (int) $update['pax_child'],
                        'pax_infant' => (int) $update['pax_infant'],
                    ],
                    errorIndex: $index,
                );

                $schedule->update([
                    'pax_adult' => (int) $update['pax_adult'],
                    'pax_child' => (int) $update['pax_child'],
                    'pax_infant' => (int) $update['pax_infant'],
                ]);
            });

            return $waitingList->fresh('schedules');
        });
    }

    private function assertCustomerCanManage(User $customer, TourWaitingList $waitingList): void
    {
        if ((int) $waitingList->customer_user_id !== (int) $customer->id) {
            throw ValidationException::withMessages([
                'waiting_list' => 'You are not allowed to update this waiting-list request.',
            ]);
        }

        if (! in_array($waitingList->status, [
            TourWaitingListStatus::PENDING,
            TourWaitingListStatus::CONTACTED,
        ], true)) {
            throw ValidationException::withMessages([
                'status' => 'This waiting-list request can no longer be updated.',
            ]);
        }

        $hasQueued = $waitingList->schedules->contains(
            fn (TourWaitingListSchedule $schedule): bool => $schedule->status === TourWaitingListScheduleStatus::QUEUED,
        );

        $hasOffered = $waitingList->schedules->contains(
            fn (TourWaitingListSchedule $schedule): bool => $schedule->status === TourWaitingListScheduleStatus::OFFERED,
        );

        if (! $hasQueued || $hasOffered) {
            throw ValidationException::withMessages([
                'status' => 'Only active queued waiting-list requests can be updated.',
            ]);
        }
    }
}
