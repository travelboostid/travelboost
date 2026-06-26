<?php

use App\Actions\WaitingList\ExpirePastDeadlineWaitingListSchedulesAction;
use App\Enums\TourWaitingListScheduleStatus;
use App\Enums\TourWaitingListStatus;
use App\Models\Company;
use App\Models\TourWaitingList;
use App\Models\User;
use Database\Seeders\Common\RolePermissionSeeder;

require_once __DIR__.'/../Support/WaitingListTestHelpers.php';

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);
});

test('queued waiting list schedules past booking deadline are expired', function () {
    ['vendor' => $vendor, 'tour' => $tour] = waitingListTourFixture(bookingDeadline: 7);
    $schedule = waitingListScheduleFixture($tour, available: 0, departureInDays: 3);
    $waitingList = createCustomerWaitingList($tour, User::factory()->create(), $schedule->id);
    $entry = $waitingList->schedules->first();

    expect($entry->status)->toBe(TourWaitingListScheduleStatus::QUEUED);

    $expiredCount = app(ExpirePastDeadlineWaitingListSchedulesAction::class)->execute();

    expect($expiredCount)->toBe(1)
        ->and($entry->fresh()->status)->toBe(TourWaitingListScheduleStatus::EXPIRED)
        ->and($waitingList->fresh()->status)->toBe(TourWaitingListStatus::EXPIRED);
});

test('waiting list schedules before booking deadline are not expired', function () {
    ['vendor' => $vendor, 'tour' => $tour] = waitingListTourFixture(bookingDeadline: 7);
    $schedule = waitingListScheduleFixture($tour, available: 0, departureInDays: 30);
    $waitingList = createCustomerWaitingList($tour, User::factory()->create(), $schedule->id);
    $entry = $waitingList->schedules->first();

    $expiredCount = app(ExpirePastDeadlineWaitingListSchedulesAction::class)->execute();

    expect($expiredCount)->toBe(0)
        ->and($entry->fresh()->status)->toBe(TourWaitingListScheduleStatus::QUEUED);
});

test('vendor cannot offer seat after booking deadline passes', function () {
    ['vendor' => $vendor, 'tour' => $tour] = waitingListTourFixture(bookingDeadline: 7);
    $schedule = waitingListScheduleFixture($tour, available: 2, departureInDays: 3);
    $vendorUser = User::factory()->create();
    attachWaitingListUserToCompany($vendorUser, $vendor);
    $waitingList = createCustomerWaitingList($tour, User::factory()->create(), $schedule->id, adult: 2);
    $entry = $waitingList->schedules->first();

    $this->actingAs($vendorUser)
        ->post(
            "/companies/{$vendor->username}/dashboard/waiting-lists/{$waitingList->id}/schedules/{$entry->id}/offer",
        )
        ->assertSessionHasErrors('schedule');
});

test('agent can view waiting lists but cannot manage vendor queues', function () {
    ['vendor' => $vendor, 'tour' => $tour] = waitingListTourFixture();
    $schedule = waitingListScheduleFixture($tour, available: 2);

    $agent = Company::factory()->create(['type' => 'agent']);
    $agentUser = User::factory()->create();
    attachWaitingListUserToCompany($agentUser, $agent);

    $waitingList = TourWaitingList::query()->create([
        'tour_id' => $tour->id,
        'vendor_id' => $vendor->id,
        'created_by_company_id' => $agent->id,
        'created_by_user_id' => $agentUser->id,
        'contact_name' => 'Agent Customer',
        'contact_email' => 'agent-customer@example.com',
        'contact_phone' => '081234567890',
        'status' => TourWaitingListStatus::PENDING,
    ]);
    createQueuedWaitingListSchedule($waitingList, $schedule->id);
    $entry = $waitingList->fresh('schedules')->schedules->first();

    $this->actingAs($agentUser)
        ->get("/companies/{$agent->username}/dashboard/waiting-lists")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('companies/dashboard/waiting-lists/index')
            ->where('permissions.can_manage_queues', false)
        );

    $this->actingAs($agentUser)
        ->post(
            "/companies/{$agent->username}/dashboard/waiting-lists/{$waitingList->id}/schedules/{$entry->id}/offer",
        )
        ->assertForbidden();

    $this->actingAs($agentUser)
        ->patch(
            "/companies/{$agent->username}/dashboard/waiting-lists/schedules/{$schedule->id}/queue/reorder",
            ['order' => [$entry->id]],
        )
        ->assertForbidden();
});
