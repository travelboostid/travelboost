<?php

namespace App\Actions\WaitingList;

use App\Enums\CompanyType;
use App\Enums\TourWaitingListStatus;
use App\Models\AgentTour;
use App\Models\Company;
use App\Models\Tour;
use App\Models\TourAvailability;
use App\Models\TourSchedule;
use App\Models\TourWaitingList;
use App\Models\TourWaitingListSchedule;
use App\Models\User;
use App\Services\TourScheduleDisplayPriceService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateTourWaitingListAction
{
    public function __construct(
        private readonly TourScheduleDisplayPriceService $displayPriceService,
    ) {}

    /**
     * @param  array{
     *     schedules: list<array{
     *         schedule_id: int,
     *         pax_adult: int,
     *         pax_child: int,
     *         pax_infant: int,
     *         accepts_partial_fulfillment: bool,
     *         minimum_partial_seats?: int|null,
     *         is_priority: bool
     *     }>,
     *     contact_name: string,
     *     contact_phone: string,
     *     contact_email: string,
     *     contact_address?: string|null
     * }  $data
     */
    public function execute(
        User $creator,
        Tour $tour,
        array $data,
        ?Company $creatorCompany = null,
        ?Company $tenantAgent = null,
    ): TourWaitingList {
        return DB::transaction(function () use ($creator, $tour, $data, $creatorCompany, $tenantAgent): TourWaitingList {
            $isCustomerSubmission = $tenantAgent !== null;
            $this->assertSubmissionContext($creator, $tour, $creatorCompany, $tenantAgent);

            $scheduleSelections = collect($data['schedules'])->values();
            $scheduleIds = $scheduleSelections
                ->pluck('schedule_id')
                ->map(fn (mixed $id): int => (int) $id)
                ->unique()
                ->values();

            if (
                $scheduleSelections->isEmpty()
                || $scheduleSelections->count() > 2
                || $scheduleIds->count() !== $scheduleSelections->count()
            ) {
                throw ValidationException::withMessages([
                    'schedules' => 'Add one or two unique departure schedules.',
                ]);
            }

            if ($scheduleSelections->where('is_priority', true)->count() !== 1) {
                throw ValidationException::withMessages([
                    'schedules' => 'Select exactly one priority schedule.',
                ]);
            }

            $schedules = TourSchedule::query()
                ->whereIn('id', $scheduleIds)
                ->lockForUpdate()
                ->with('prices.priceCategory')
                ->get()
                ->keyBy('id');

            $availabilities = TourAvailability::query()
                ->whereIn('schedule_id', $scheduleIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('schedule_id');

            $validatedSelections = $this->validateSchedules(
                $tour,
                $scheduleSelections,
                $schedules,
                $availabilities,
            );

            if ($isCustomerSubmission) {
                $this->assertCustomerLimit($creator, $scheduleIds);
            }

            $waitingList = TourWaitingList::query()->create([
                'tour_id' => $tour->id,
                'vendor_id' => $tour->company_id,
                'created_by_user_id' => $creator->id,
                'created_by_company_id' => $creatorCompany?->id,
                'customer_user_id' => $isCustomerSubmission ? $creator->id : null,
                'contact_name' => trim($data['contact_name']),
                'contact_phone' => trim($data['contact_phone']),
                'contact_email' => mb_strtolower(trim($data['contact_email'])),
                'contact_address' => filled($data['contact_address'] ?? null)
                    ? trim((string) $data['contact_address'])
                    : null,
                'status' => TourWaitingListStatus::PENDING,
            ]);

            foreach ($validatedSelections as $index => $validatedSelection) {
                $schedule = $validatedSelection['schedule'];
                $selection = $validatedSelection['selection'];
                $availability = $availabilities->get($schedule->id);

                $waitingList->schedules()->create([
                    'tour_schedule_id' => $schedule->id,
                    'preference_order' => $index + 1,
                    'available_seats_at_request' => (int) $availability->available,
                    'display_price_at_request' => $this->displayPriceService->resolve($schedule, $tour),
                    'pax_adult' => (int) $selection['pax_adult'],
                    'pax_child' => (int) $selection['pax_child'],
                    'pax_infant' => (int) $selection['pax_infant'],
                    'accepts_partial_fulfillment' => (bool) $selection['accepts_partial_fulfillment'],
                    'minimum_partial_seats' => (bool) $selection['accepts_partial_fulfillment']
                        ? (int) $selection['minimum_partial_seats']
                        : null,
                    'is_priority' => (bool) $selection['is_priority'],
                ]);
            }

            return $waitingList->load('schedules.tourSchedule');
        });
    }

    private function assertSubmissionContext(
        User $creator,
        Tour $tour,
        ?Company $creatorCompany,
        ?Company $tenantAgent,
    ): void {
        abort_if($creatorCompany !== null && $tenantAgent !== null, 403);
        abort_if($creatorCompany === null && $tenantAgent === null, 403);
        abort_unless(($tour->status->value ?? $tour->status) === 'active', 404);

        if ($creatorCompany !== null) {
            $companyType = $creatorCompany->type->value ?? $creatorCompany->type;
            abort_unless(in_array($companyType, [CompanyType::VENDOR->value, CompanyType::AGENT->value], true), 403);

            if ($companyType === CompanyType::VENDOR->value) {
                abort_unless((int) $tour->company_id === (int) $creatorCompany->id, 404);

                return;
            }

            $this->assertActiveAgentTour($creatorCompany, $tour);

            return;
        }

        abort_unless($creator->hasRole('user:customer'), 403);
        abort_unless(($tenantAgent?->type->value ?? $tenantAgent?->type) === CompanyType::AGENT->value, 404);
        $this->assertActiveAgentTour($tenantAgent, $tour);
    }

    private function assertActiveAgentTour(Company $agent, Tour $tour): void
    {
        abort_unless(AgentTour::query()
            ->where('company_id', $agent->id)
            ->where('tour_id', $tour->id)
            ->where('status', 'active')
            ->exists(), 404);
    }

    /**
     * @param  Collection<int, array{
     *     schedule_id: int,
     *     pax_adult: int,
     *     pax_child: int,
     *     pax_infant: int,
     *     accepts_partial_fulfillment: bool,
     *     minimum_partial_seats?: int|null,
     *     is_priority: bool
     * }>  $scheduleSelections
     * @param  Collection<int, TourSchedule>  $schedules
     * @param  Collection<int, TourAvailability>  $availabilities
     * @return Collection<int, array{schedule: TourSchedule, selection: array<string, mixed>}>
     */
    private function validateSchedules(
        Tour $tour,
        Collection $scheduleSelections,
        Collection $schedules,
        Collection $availabilities,
    ): Collection {
        $tour->loadMissing('company.companySetting');
        $bookingDeadlineDays = max(0, (int) ($tour->company?->companySetting?->booking_deadline ?? 0));
        $earliestBookableDeparture = now()->startOfDay()->addDays($bookingDeadlineDays);

        return $scheduleSelections->map(function (array $selection, int $index) use (
            $tour,
            $schedules,
            $availabilities,
            $earliestBookableDeparture,
        ): array {
            $scheduleId = (int) $selection['schedule_id'];
            $requiredSeats = (int) $selection['pax_adult'] + (int) $selection['pax_child'];
            $minimumPartialSeats = filled($selection['minimum_partial_seats'] ?? null)
                ? (int) $selection['minimum_partial_seats']
                : null;
            $acceptsPartialFulfillment = (bool) $selection['accepts_partial_fulfillment'];
            $schedule = $schedules->get($scheduleId);
            $availability = $availabilities->get($scheduleId);

            if ($requiredSeats < 1) {
                throw ValidationException::withMessages([
                    "schedules.{$index}.pax_adult" => 'At least one adult or child seat is required.',
                ]);
            }

            if (
                ! $schedule
                || (int) $schedule->tour_id !== (int) $tour->id
                || (int) $schedule->company_id !== (int) $tour->company_id
                || ! $schedule->is_active
            ) {
                throw ValidationException::withMessages([
                    "schedules.{$index}.schedule_id" => 'The selected departure schedule is unavailable.',
                ]);
            }

            if (Carbon::parse($schedule->departure_date)->startOfDay()->lt($earliestBookableDeparture)) {
                throw ValidationException::withMessages([
                    "schedules.{$index}.schedule_id" => 'The selected departure schedule has passed the booking deadline.',
                ]);
            }

            if (! $availability) {
                throw ValidationException::withMessages([
                    "schedules.{$index}.schedule_id" => 'Seat availability is unavailable for this schedule.',
                ]);
            }

            if ($requiredSeats <= (int) $availability->available) {
                throw ValidationException::withMessages([
                    "schedules.{$index}.pax_adult" => 'Seats are currently available for this passenger count. Please use Book Tour instead.',
                ]);
            }

            if ($acceptsPartialFulfillment && $minimumPartialSeats === null) {
                throw ValidationException::withMessages([
                    "schedules.{$index}.minimum_partial_seats" => 'Enter the minimum number of seat-using passengers that may still proceed.',
                ]);
            }

            if (! $acceptsPartialFulfillment && $minimumPartialSeats !== null) {
                throw ValidationException::withMessages([
                    "schedules.{$index}.minimum_partial_seats" => 'Minimum partial seats is only allowed when partial fulfillment is accepted.',
                ]);
            }

            if ($minimumPartialSeats !== null && $minimumPartialSeats < 1) {
                throw ValidationException::withMessages([
                    "schedules.{$index}.minimum_partial_seats" => 'Minimum partial seats must be at least one adult or child passenger.',
                ]);
            }

            if ($minimumPartialSeats !== null && $minimumPartialSeats > $requiredSeats) {
                throw ValidationException::withMessages([
                    "schedules.{$index}.minimum_partial_seats" => 'Minimum partial seats may not exceed the total adult and child passengers.',
                ]);
            }

            return [
                'schedule' => $schedule,
                'selection' => $selection,
            ];
        });
    }

    /**
     * @param  Collection<int, int>  $scheduleIds
     */
    private function assertCustomerLimit(User $customer, Collection $scheduleIds): void
    {
        User::query()->whereKey($customer->id)->lockForUpdate()->firstOrFail();

        $activeStatuses = TourWaitingListStatus::activeValues();
        $existingScheduleCount = TourWaitingListSchedule::query()
            ->whereHas('waitingList', fn ($query) => $query
                ->where('customer_user_id', $customer->id)
                ->whereIn('status', $activeStatuses))
            ->count();

        if ($existingScheduleCount + $scheduleIds->count() > 2) {
            throw ValidationException::withMessages([
                'schedules' => 'A customer may have a maximum of two active waiting-listed schedules across all tours.',
            ]);
        }

        $hasDuplicateSchedule = TourWaitingListSchedule::query()
            ->whereIn('tour_schedule_id', $scheduleIds)
            ->whereHas('waitingList', fn ($query) => $query
                ->where('customer_user_id', $customer->id)
                ->whereIn('status', $activeStatuses))
            ->exists();

        if ($hasDuplicateSchedule) {
            throw ValidationException::withMessages([
                'schedules' => 'You already have an active waiting-list request for one of the selected schedules.',
            ]);
        }
    }
}
