<?php

use App\Enums\CompanyTeamStatus;
use App\Enums\TourWaitingListStatus;
use App\Models\AgentTour;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Domain;
use App\Models\Tour;
use App\Models\TourAvailability;
use App\Models\TourSchedule;
use App\Models\TourWaitingList;
use App\Models\User;
use Database\Seeders\Common\RolePermissionSeeder;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

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

/**
 * @param  list<int>  $scheduleIds
 * @return array<string, mixed>
 */
function waitingListRequestPayload(
    array $scheduleIds,
    int $adult = 3,
    int $child = 0,
    int $infant = 0,
): array {
    return [
        'schedules' => collect($scheduleIds)
            ->values()
            ->map(fn (int $scheduleId, int $index): array => [
                'schedule_id' => $scheduleId,
                'pax_adult' => $adult,
                'pax_child' => $child,
                'pax_infant' => $infant,
                'accepts_partial_fulfillment' => true,
                'minimum_partial_seats' => max(1, $adult + $child - 1),
                'is_priority' => $index === 0,
            ])
            ->all(),
        'contact_name' => 'Waiting Customer',
        'contact_phone' => '081234567890',
        'contact_email' => 'waiting@example.test',
        'contact_address' => 'Jakarta',
    ];
}

test('vendor can submit two waiting list schedules without changing availability', function () {
    ['vendor' => $vendor, 'tour' => $tour] = waitingListTourFixture();
    $firstSchedule = waitingListScheduleFixture($tour);
    $secondSchedule = waitingListScheduleFixture($tour, departureInDays: 40);
    $user = User::factory()->create();
    attachWaitingListUserToCompany($user, $vendor);
    $payload = waitingListRequestPayload([$firstSchedule->id, $secondSchedule->id]);
    $payload['schedules'][1] = [
        ...$payload['schedules'][1],
        'pax_adult' => 1,
        'pax_child' => 2,
        'pax_infant' => 1,
        'accepts_partial_fulfillment' => false,
        'minimum_partial_seats' => null,
    ];

    $response = $this->actingAs($user)->post(
        "/companies/{$vendor->username}/dashboard/tours/{$tour->id}/waiting-lists",
        $payload,
    );

    $response->assertRedirect()->assertSessionHasNoErrors();
    $waitingList = TourWaitingList::query()->sole();

    expect($waitingList->vendor_id)->toBe($vendor->id)
        ->and($waitingList->created_by_company_id)->toBe($vendor->id)
        ->and($waitingList->customer_user_id)->toBeNull()
        ->and($waitingList->status)->toBe(TourWaitingListStatus::PENDING)
        ->and($waitingList->schedules)->toHaveCount(2)
        ->and($waitingList->schedules->first()->is_priority)->toBeTrue()
        ->and($waitingList->schedules->first()->pax_adult)->toBe(3)
        ->and($waitingList->schedules->first()->minimum_partial_seats)->toBe(2)
        ->and($waitingList->schedules->last()->pax_child)->toBe(2)
        ->and($waitingList->schedules->last()->pax_infant)->toBe(1)
        ->and($waitingList->schedules->last()->accepts_partial_fulfillment)->toBeFalse()
        ->and($waitingList->schedules->last()->minimum_partial_seats)->toBeNull()
        ->and((int) $firstSchedule->availability()->value('available'))->toBe(2);
});

test('available seats use standard booking and infants do not consume seats', function () {
    ['vendor' => $vendor, 'tour' => $tour] = waitingListTourFixture();
    $schedule = waitingListScheduleFixture($tour, available: 2);
    $user = User::factory()->create();
    attachWaitingListUserToCompany($user, $vendor);

    $response = $this->actingAs($user)->post(
        "/companies/{$vendor->username}/dashboard/tours/{$tour->id}/waiting-lists",
        waitingListRequestPayload([$schedule->id], adult: 2, infant: 5),
    );

    $response->assertSessionHasErrors('schedules.0.pax_adult');
    expect(TourWaitingList::query()->count())->toBe(0);
});

test('waiting list requires exactly one priority schedule', function () {
    ['vendor' => $vendor, 'tour' => $tour] = waitingListTourFixture();
    $firstSchedule = waitingListScheduleFixture($tour);
    $secondSchedule = waitingListScheduleFixture($tour, departureInDays: 40);
    $user = User::factory()->create();
    attachWaitingListUserToCompany($user, $vendor);
    $payload = waitingListRequestPayload([$firstSchedule->id, $secondSchedule->id]);
    $payload['schedules'][0]['is_priority'] = false;

    $this->actingAs($user)->post(
        "/companies/{$vendor->username}/dashboard/tours/{$tour->id}/waiting-lists",
        $payload,
    )->assertSessionHasErrors('schedules');

    expect(TourWaitingList::query()->count())->toBe(0);
});

test('partial fulfillment requires a minimum seat threshold within adult and child totals', function () {
    ['vendor' => $vendor, 'tour' => $tour] = waitingListTourFixture();
    $schedule = waitingListScheduleFixture($tour);
    $user = User::factory()->create();
    attachWaitingListUserToCompany($user, $vendor);
    $url = "/companies/{$vendor->username}/dashboard/tours/{$tour->id}/waiting-lists";

    $missingMinimumPayload = waitingListRequestPayload([$schedule->id]);
    $missingMinimumPayload['schedules'][0]['minimum_partial_seats'] = null;

    $this->actingAs($user)->post($url, $missingMinimumPayload)
        ->assertSessionHasErrors('schedules.0.minimum_partial_seats');

    $overflowMinimumPayload = waitingListRequestPayload([$schedule->id], adult: 4, child: 1);
    $overflowMinimumPayload['schedules'][0]['minimum_partial_seats'] = 6;

    $this->actingAs($user)->post($url, $overflowMinimumPayload)
        ->assertSessionHasErrors('schedules.0.minimum_partial_seats');
});

test('waiting list rejects three schedules and schedules past the booking deadline', function () {
    ['vendor' => $vendor, 'tour' => $tour] = waitingListTourFixture(bookingDeadline: 10);
    $pastDeadline = waitingListScheduleFixture($tour, departureInDays: 5);
    $futureSchedules = collect([20, 30])->map(
        fn (int $days): TourSchedule => waitingListScheduleFixture($tour, departureInDays: $days),
    );
    $user = User::factory()->create();
    attachWaitingListUserToCompany($user, $vendor);
    $url = "/companies/{$vendor->username}/dashboard/tours/{$tour->id}/waiting-lists";

    $this->actingAs($user)->post($url, waitingListRequestPayload([$pastDeadline->id]))
        ->assertSessionHasErrors('schedules.0.schedule_id');

    $this->actingAs($user)->post($url, waitingListRequestPayload([
        $pastDeadline->id,
        ...$futureSchedules->pluck('id')->all(),
    ]))->assertSessionHasErrors('schedules');
});

test('agent has unlimited submissions only for active catalog tours', function () {
    ['tour' => $tour] = waitingListTourFixture();
    $schedule = waitingListScheduleFixture($tour);
    $agent = Company::factory()->create(['type' => 'agent']);
    $user = User::factory()->create();
    attachWaitingListUserToCompany($user, $agent);
    $url = "/companies/{$agent->username}/dashboard/tours/{$tour->id}/waiting-lists";

    $this->actingAs($user)->post($url, waitingListRequestPayload([$schedule->id]))
        ->assertNotFound();

    AgentTour::query()->create([
        'company_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => 'active',
    ]);

    foreach (range(1, 3) as $submission) {
        $this->actingAs($user)->post(
            $url,
            waitingListRequestPayload([$schedule->id], adult: 3 + $submission),
        )->assertSessionHasNoErrors();
    }

    expect(TourWaitingList::query()->count())->toBe(3);
});

test('customer has a global limit of two active waiting listed schedules', function () {
    ['tour' => $tour] = waitingListTourFixture();
    $schedules = collect([20, 30, 40])->map(
        fn (int $days): TourSchedule => waitingListScheduleFixture($tour, departureInDays: $days),
    );
    $agent = Company::factory()->create(['type' => 'agent']);
    Domain::create([
        'subdomain' => $agent->username,
        'owner_type' => 'company',
        'owner_id' => $agent->id,
        'subdomain_enabled' => true,
    ]);
    AgentTour::query()->create([
        'company_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => 'active',
    ]);
    $customer = User::factory()->create();
    $customer->addRole('user:customer');
    $appHost = env('APP_HOST', 'localhost');
    $url = "http://{$agent->username}.{$appHost}/tours/{$tour->id}/waiting-lists";

    $this->actingAs($customer)->post(
        $url,
        waitingListRequestPayload($schedules->take(2)->pluck('id')->all()),
    )->assertSessionHasNoErrors();

    $this->actingAs($customer)->post(
        $url,
        waitingListRequestPayload([$schedules->last()->id]),
    )->assertSessionHasErrors('schedules');

    expect(TourWaitingList::query()->where('customer_user_id', $customer->id)->count())->toBe(1);
});

test('terminal customer requests no longer count toward the global limit', function () {
    ['tour' => $tour] = waitingListTourFixture();
    $schedules = collect([20, 30, 40])->map(
        fn (int $days): TourSchedule => waitingListScheduleFixture($tour, departureInDays: $days),
    );
    $agent = Company::factory()->create(['type' => 'agent']);
    Domain::create([
        'subdomain' => $agent->username,
        'owner_type' => 'company',
        'owner_id' => $agent->id,
        'subdomain_enabled' => true,
    ]);
    AgentTour::query()->create([
        'company_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => 'active',
    ]);
    $customer = User::factory()->create();
    $customer->addRole('user:customer');
    $appHost = env('APP_HOST', 'localhost');
    $url = "http://{$agent->username}.{$appHost}/tours/{$tour->id}/waiting-lists";

    $this->actingAs($customer)->post(
        $url,
        waitingListRequestPayload($schedules->take(2)->pluck('id')->all()),
    )->assertSessionHasNoErrors();

    TourWaitingList::query()->sole()->update(['status' => TourWaitingListStatus::CANCELLED]);

    $this->actingAs($customer)->post(
        $url,
        waitingListRequestPayload([$schedules->last()->id]),
    )->assertSessionHasNoErrors();

    expect(TourWaitingList::query()->where('customer_user_id', $customer->id)->count())->toBe(2);
});

test('guest cannot submit a customer waiting list', function () {
    ['tour' => $tour] = waitingListTourFixture();
    $schedule = waitingListScheduleFixture($tour);
    $agent = Company::factory()->create(['type' => 'agent']);
    Domain::create([
        'subdomain' => $agent->username,
        'owner_type' => 'company',
        'owner_id' => $agent->id,
        'subdomain_enabled' => true,
    ]);
    AgentTour::query()->create([
        'company_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => 'active',
    ]);
    $appHost = env('APP_HOST', 'localhost');

    $response = $this->post(
        "http://{$agent->username}.{$appHost}/tours/{$tour->id}/waiting-lists",
        waitingListRequestPayload([$schedule->id]),
    );

    $response->assertRedirect();
    expect(TourWaitingList::query()->count())->toBe(0);
});
