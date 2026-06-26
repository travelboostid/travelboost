<?php

use App\Enums\TourWaitingListScheduleStatus;
use App\Enums\TourWaitingListStatus;
use App\Models\Company;
use App\Models\User;
use Database\Seeders\Common\RolePermissionSeeder;

require_once __DIR__.'/../Support/WaitingListTestHelpers.php';

use Tests\TestCase;

beforeEach(function () {
    /** @var TestCase $this */
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);
});

test('vendor can reorder waiting list queue via dashboard', function () {
    ['vendor' => $vendor, 'tour' => $tour] = waitingListTourFixture();
    $schedule = waitingListScheduleFixture($tour, available: 0);
    $vendorUser = User::factory()->create();
    attachWaitingListUserToCompany($vendorUser, $vendor);

    $first = createCustomerWaitingList($tour, User::factory()->create(), $schedule->id)->schedules->first();
    $second = createCustomerWaitingList($tour, User::factory()->create(), $schedule->id)->schedules->first();

    $this->actingAs($vendorUser)
        ->patch(
            "/companies/{$vendor->username}/dashboard/waiting-lists/schedules/{$schedule->id}/queue/reorder",
            ['order' => [$second->id, $first->id]],
        )
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    expect($second->fresh()->manual_queue_position)->toBe(1)
        ->and($first->fresh()->manual_queue_position)->toBe(2);
});

test('vendor can manually offer a queued waiting list schedule', function () {
    ['vendor' => $vendor, 'tour' => $tour] = waitingListTourFixture();
    $schedule = waitingListScheduleFixture($tour, available: 2);
    $vendorUser = User::factory()->create();
    attachWaitingListUserToCompany($vendorUser, $vendor);
    $customer = User::factory()->create();
    $waitingList = createCustomerWaitingList($tour, $customer, $schedule->id, adult: 2);
    $entry = $waitingList->schedules->first();

    $this->actingAs($vendorUser)
        ->post(
            "/companies/{$vendor->username}/dashboard/waiting-lists/{$waitingList->id}/schedules/{$entry->id}/offer",
        )
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    expect($entry->fresh()->status)->toBe(TourWaitingListScheduleStatus::OFFERED);
});

test('vendor can mark waiting list as contacted and cancelled', function () {
    ['vendor' => $vendor, 'tour' => $tour] = waitingListTourFixture();
    $schedule = waitingListScheduleFixture($tour, available: 0);
    $vendorUser = User::factory()->create();
    attachWaitingListUserToCompany($vendorUser, $vendor);
    $waitingList = createCustomerWaitingList($tour, User::factory()->create(), $schedule->id);

    $this->actingAs($vendorUser)
        ->patch(
            "/companies/{$vendor->username}/dashboard/waiting-lists/{$waitingList->id}/status",
            ['status' => 'contacted'],
        )
        ->assertSessionHasNoErrors();

    expect($waitingList->fresh()->status)->toBe(TourWaitingListStatus::CONTACTED);

    $this->actingAs($vendorUser)
        ->patch(
            "/companies/{$vendor->username}/dashboard/waiting-lists/{$waitingList->id}/status",
            ['status' => 'cancelled'],
        )
        ->assertSessionHasNoErrors();

    expect($waitingList->fresh()->status)->toBe(TourWaitingListStatus::CANCELLED)
        ->and($waitingList->fresh()->schedules->first()->status)->toBe(TourWaitingListScheduleStatus::CANCELLED);
});

test('unauthorized company cannot manage another vendors waiting list', function () {
    ['vendor' => $vendor, 'tour' => $tour] = waitingListTourFixture();
    $schedule = waitingListScheduleFixture($tour, available: 2);
    $otherVendor = Company::factory()->create(['type' => 'vendor']);
    $otherUser = User::factory()->create();
    attachWaitingListUserToCompany($otherUser, $otherVendor);

    $waitingList = createCustomerWaitingList($tour, User::factory()->create(), $schedule->id);
    $entry = $waitingList->schedules->first();

    $this->actingAs($otherUser)
        ->post(
            "/companies/{$otherVendor->username}/dashboard/waiting-lists/{$waitingList->id}/schedules/{$entry->id}/offer",
        )
        ->assertForbidden();
});

test('vendor can view schedule queue page', function () {
    ['vendor' => $vendor, 'tour' => $tour] = waitingListTourFixture();
    $schedule = waitingListScheduleFixture($tour, available: 0);
    $vendorUser = User::factory()->create();
    attachWaitingListUserToCompany($vendorUser, $vendor);
    createCustomerWaitingList($tour, User::factory()->create(), $schedule->id);

    $this->actingAs($vendorUser)
        ->get("/companies/{$vendor->username}/dashboard/waiting-lists/schedules/{$schedule->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('companies/dashboard/waiting-lists/show')
            ->has('queue', 1)
            ->where('permissions.can_manage_queues', true)
        );
});
