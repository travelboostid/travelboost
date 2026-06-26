<?php

use App\Enums\CompanyTeamStatus;
use App\Enums\TourWaitingListScheduleStatus;
use App\Enums\TourWaitingListStatus;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Domain;
use App\Models\Tour;
use App\Models\TourAvailability;
use App\Models\TourSchedule;
use App\Models\TourWaitingList;
use App\Models\TourWaitingListSchedule;
use App\Models\User;

function createQueuedWaitingListSchedule(
    TourWaitingList $waitingList,
    int $scheduleId,
    int $adult = 2,
    int $child = 0,
    ?int $manualPosition = null,
): TourWaitingListSchedule {
    return TourWaitingListSchedule::query()->create([
        'tour_waiting_list_id' => $waitingList->id,
        'tour_schedule_id' => $scheduleId,
        'status' => TourWaitingListScheduleStatus::QUEUED,
        'preference_order' => 1,
        'available_seats_at_request' => 0,
        'display_price_at_request' => 2_500_000,
        'pax_adult' => $adult,
        'pax_child' => $child,
        'pax_infant' => 0,
        'accepts_partial_fulfillment' => false,
        'minimum_partial_seats' => null,
        'is_priority' => true,
        'manual_queue_position' => $manualPosition,
    ]);
}

function createCustomerWaitingList(Tour $tour, User $customer, int $scheduleId, int $adult = 2): TourWaitingList
{
    $waitingList = TourWaitingList::query()->create([
        'tour_id' => $tour->id,
        'vendor_id' => $tour->company_id,
        'created_by_user_id' => $customer->id,
        'customer_user_id' => $customer->id,
        'contact_name' => $customer->name,
        'contact_email' => $customer->email,
        'contact_phone' => '081234567890',
        'status' => TourWaitingListStatus::PENDING,
    ]);

    createQueuedWaitingListSchedule($waitingList, $scheduleId, $adult);

    return $waitingList->fresh('schedules');
}

/** @return array{vendor: Company, tour: Tour} */
function waitingListTourFixture(int $bookingDeadline = 0): array
{
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $vendor->companySetting()->update(['booking_deadline' => $bookingDeadline]);
    $tour = Tour::factory()->create([
        'company_id' => $vendor->id,
        'status' => 'active',
        'showprice' => 2_500_000,
    ]);

    return compact('vendor', 'tour');
}

function waitingListScheduleFixture(
    Tour $tour,
    int $available = 2,
    int $departureInDays = 30,
): TourSchedule {
    $schedule = TourSchedule::query()->create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $tour->company_id,
        'departure_date' => now()->addDays($departureInDays)->toDateString(),
        'return_date' => now()->addDays($departureInDays + 7)->toDateString(),
        'is_active' => true,
    ]);

    TourAvailability::query()->create([
        'company_id' => $tour->company_id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => max(10, $available),
        'available' => $available,
    ]);

    return $schedule;
}

function attachWaitingListUserToCompany(User $user, Company $company): void
{
    CompanyTeam::query()->create([
        'company_id' => $company->id,
        'user_id' => $user->id,
        'invite_role' => 'superadmin',
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);
    $user->addRole("company:{$company->id}:superadmin", "company:{$company->id}");
}

function createTenantDomain(Company $company): void
{
    Domain::query()->create([
        'subdomain' => $company->username,
        'owner_type' => Company::class,
        'owner_id' => $company->id,
        'domain_enabled' => true,
        'subdomain_enabled' => true,
    ]);
}
