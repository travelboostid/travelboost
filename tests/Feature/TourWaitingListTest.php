<?php

use App\Enums\TourWaitingListStatus;
use App\Models\AgentTour;
use App\Models\Company;
use App\Models\Domain;
use App\Models\TourSchedule;
use App\Models\TourWaitingList;
use App\Models\TourWaitingListSchedule;
use App\Models\User;
use Database\Seeders\Common\RolePermissionSeeder;

require_once __DIR__.'/../Support/WaitingListTestHelpers.php';

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

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
                'accepts_partial_fulfillment' => false,
                'minimum_partial_seats' => null,
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
    $firstSchedule = waitingListScheduleFixture($tour, available: 0);
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
        ->and($waitingList->schedules->first()->minimum_partial_seats)->toBeNull()
        ->and($waitingList->schedules->last()->pax_child)->toBe(2)
        ->and($waitingList->schedules->last()->pax_infant)->toBe(1)
        ->and($waitingList->schedules->last()->accepts_partial_fulfillment)->toBeFalse()
        ->and($waitingList->schedules->last()->minimum_partial_seats)->toBeNull()
        ->and((int) $firstSchedule->availability()->value('available'))->toBe(0);
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
    $missingMinimumPayload['schedules'][0]['accepts_partial_fulfillment'] = true;
    $missingMinimumPayload['schedules'][0]['minimum_partial_seats'] = null;

    $this->actingAs($user)->post($url, $missingMinimumPayload)
        ->assertSessionHasErrors('schedules.0.minimum_partial_seats');

    $overflowMinimumPayload = waitingListRequestPayload([$schedule->id], adult: 4, child: 1);
    $overflowMinimumPayload['schedules'][0]['accepts_partial_fulfillment'] = true;
    $overflowMinimumPayload['schedules'][0]['minimum_partial_seats'] = 6;

    $this->actingAs($user)->post($url, $overflowMinimumPayload)
        ->assertSessionHasErrors('schedules.0.minimum_partial_seats');

    $insufficientAgainstAvailabilityPayload = waitingListRequestPayload([$schedule->id], adult: 5, child: 1);
    $insufficientAgainstAvailabilityPayload['schedules'][0]['accepts_partial_fulfillment'] = true;
    $insufficientAgainstAvailabilityPayload['schedules'][0]['minimum_partial_seats'] = 2;

    $this->actingAs($user)->post($url, $insufficientAgainstAvailabilityPayload)
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

test('customer schedules past the booking deadline no longer count toward the global limit', function () {
    ['tour' => $tour] = waitingListTourFixture(bookingDeadline: 10);
    $initialSchedules = collect([12, 13])->map(
        fn (int $days): TourSchedule => waitingListScheduleFixture($tour, departureInDays: $days),
    );
    $futureSchedule = waitingListScheduleFixture($tour, departureInDays: 40);
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
        waitingListRequestPayload($initialSchedules->pluck('id')->all()),
    )->assertSessionHasNoErrors();

    $this->travelTo(now()->addDays(5));

    $this->actingAs($customer)->post(
        $url,
        waitingListRequestPayload([$futureSchedule->id]),
    )->assertSessionHasNoErrors();

    expect(TourWaitingList::query()->where('customer_user_id', $customer->id)->count())->toBe(2);
});

test('customer must confirm before replacing an active priority waiting list', function () {
    ['tour' => $tour] = waitingListTourFixture();
    $schedules = collect([20, 30])->map(
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
        waitingListRequestPayload([$schedules[0]->id]),
    )->assertSessionHasNoErrors();

    $this->actingAs($customer)->post(
        $url,
        waitingListRequestPayload([$schedules[1]->id]),
    )->assertSessionHasErrors('replace_existing_priority');

    $replacePayload = waitingListRequestPayload([$schedules[1]->id]);
    $replacePayload['replace_existing_priority'] = true;

    $this->actingAs($customer)->post(
        $url,
        $replacePayload,
    )->assertSessionHasNoErrors();

    $prioritySchedules = TourWaitingListSchedule::query()
        ->whereHas('waitingList', fn ($query) => $query->where('customer_user_id', $customer->id))
        ->orderBy('tour_schedule_id')
        ->get();

    expect($prioritySchedules)->toHaveCount(2)
        ->and((bool) $prioritySchedules[0]->is_priority)->toBeFalse()
        ->and((bool) $prioritySchedules[1]->is_priority)->toBeTrue();
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

test('customer can join waiting list when schedule availability is zero', function () {
    ['tour' => $tour] = waitingListTourFixture();
    $schedule = waitingListScheduleFixture($tour, available: 0);
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
    $payload = waitingListRequestPayload([$schedule->id], adult: 2);
    $payload['schedules'][0]['accepts_partial_fulfillment'] = true;
    $payload['schedules'][0]['minimum_partial_seats'] = 1;

    $this->actingAs($customer)->post($url, $payload)->assertSessionHasNoErrors();

    $waitingList = TourWaitingList::query()->sole();

    expect($waitingList->agent_company_id)->toBe($agent->id)
        ->and($waitingList->customer_user_id)->toBe($customer->id)
        ->and($waitingList->schedules)->toHaveCount(1)
        ->and($waitingList->schedules->first()->status->value)->toBe('queued')
        ->and($waitingList->schedules->first()->accepts_partial_fulfillment)->toBeFalse()
        ->and($waitingList->schedules->first()->minimum_partial_seats)->toBeNull()
        ->and((int) $schedule->availability()->value('available'))->toBe(0);
});

test('vendor waiting list submission stores schedule queue status', function () {
    ['vendor' => $vendor, 'tour' => $tour] = waitingListTourFixture();
    $schedule = waitingListScheduleFixture($tour);
    $user = User::factory()->create();
    attachWaitingListUserToCompany($user, $vendor);

    $this->actingAs($user)->post(
        "/companies/{$vendor->username}/dashboard/tours/{$tour->id}/waiting-lists",
        waitingListRequestPayload([$schedule->id]),
    )->assertSessionHasNoErrors();

    expect(TourWaitingList::query()->sole()->schedules->first()->status->value)->toBe('queued');
});
