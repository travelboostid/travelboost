<?php

use App\Enums\CompanyTeamStatus;
use App\Enums\TourWaitingListStatus;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Tour;
use App\Models\TourSchedule;
use App\Models\TourWaitingList;
use App\Models\User;
use Database\Seeders\Common\RolePermissionSeeder;
use Tests\TestCase;

beforeEach(function () {
    /** @var TestCase $this */
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);
});

function attachWaitingListDashboardUser(User $user, Company $company): void
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

function createWaitingListSchedule(TourWaitingList $waitingList, int $order, bool $priority): void
{
    $schedule = TourSchedule::query()->create([
        'tour_id' => $waitingList->tour_id,
        'tour_code' => $waitingList->tour?->code,
        'company_id' => $waitingList->vendor_id,
        'departure_date' => now()->addDays(20 + $order)->toDateString(),
        'return_date' => now()->addDays(27 + $order)->toDateString(),
        'is_active' => true,
    ]);

    $waitingList->schedules()->create([
        'tour_schedule_id' => $schedule->id,
        'preference_order' => $order,
        'available_seats_at_request' => 2,
        'display_price_at_request' => 2_500_000,
        'pax_adult' => 4,
        'pax_child' => 0,
        'pax_infant' => 1,
        'accepts_partial_fulfillment' => true,
        'minimum_partial_seats' => 3,
        'is_priority' => $priority,
    ]);
}

test('vendor dashboard waiting list page shows only requests for the vendor inventory', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $vendorUser = User::factory()->create();
    attachWaitingListDashboardUser($vendorUser, $vendor);

    $tour = Tour::factory()->create([
        'company_id' => $vendor->id,
        'status' => 'active',
    ]);

    $vendorWaitingList = TourWaitingList::factory()->create([
        'tour_id' => $tour->id,
        'vendor_id' => $vendor->id,
        'created_by_company_id' => $vendor->id,
        'status' => TourWaitingListStatus::PENDING,
        'contact_name' => 'Vendor Customer',
    ]);
    createWaitingListSchedule($vendorWaitingList, 1, true);

    $otherVendor = Company::factory()->create(['type' => 'vendor']);
    $otherTour = Tour::factory()->create([
        'company_id' => $otherVendor->id,
        'status' => 'active',
    ]);
    $otherWaitingList = TourWaitingList::factory()->create([
        'tour_id' => $otherTour->id,
        'vendor_id' => $otherVendor->id,
        'created_by_company_id' => $otherVendor->id,
        'contact_name' => 'Other Customer',
    ]);
    createWaitingListSchedule($otherWaitingList, 1, true);

    $response = $this->actingAs($vendorUser)
        ->get("/companies/{$vendor->username}/dashboard/waiting-lists");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('companies/dashboard/waiting-lists/index')
        ->has('data.data', 1)
        ->where('data.data.0.contact_name', 'Vendor Customer')
        ->where('permissions.can_manage_queues', true));
});

test('agent dashboard waiting list page shows team requests and customer-form requests from the same agent account', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create([
        'company_id' => $vendor->id,
        'status' => 'active',
    ]);

    $agent = Company::factory()->create(['type' => 'agent']);
    $agentUser = User::factory()->create();
    attachWaitingListDashboardUser($agentUser, $agent);

    $teamWaitingList = TourWaitingList::factory()->create([
        'tour_id' => $tour->id,
        'vendor_id' => $vendor->id,
        'created_by_company_id' => $agent->id,
        'created_by_user_id' => $agentUser->id,
        'contact_name' => 'Agent Team Customer',
        'status' => TourWaitingListStatus::PENDING,
    ]);
    createWaitingListSchedule($teamWaitingList, 1, true);

    $customer = User::factory()->create([
        'company_id' => $agent->id,
        'name' => 'Landing Customer',
    ]);
    $customer->addRole('user:customer');

    $customerWaitingList = TourWaitingList::factory()->create([
        'tour_id' => $tour->id,
        'vendor_id' => $vendor->id,
        'created_by_company_id' => null,
        'customer_user_id' => $customer->id,
        'created_by_user_id' => $customer->id,
        'contact_name' => 'Landing Customer',
        'status' => TourWaitingListStatus::CONTACTED,
    ]);
    createWaitingListSchedule($customerWaitingList, 1, true);

    $otherAgent = Company::factory()->create(['type' => 'agent']);
    $otherCustomer = User::factory()->create([
        'company_id' => $otherAgent->id,
        'name' => 'Outside Customer',
    ]);
    $otherCustomer->addRole('user:customer');

    $otherWaitingList = TourWaitingList::factory()->create([
        'tour_id' => $tour->id,
        'vendor_id' => $vendor->id,
        'created_by_company_id' => null,
        'customer_user_id' => $otherCustomer->id,
        'created_by_user_id' => $otherCustomer->id,
        'contact_name' => 'Outside Customer',
    ]);
    createWaitingListSchedule($otherWaitingList, 1, true);

    $response = $this->actingAs($agentUser)
        ->get("/companies/{$agent->username}/dashboard/waiting-lists");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('companies/dashboard/waiting-lists/index')
        ->has('data.data', 2)
        ->where('data.data.0.vendor.name', $vendor->name)
        ->where('permissions.can_manage_queues', false));
});
