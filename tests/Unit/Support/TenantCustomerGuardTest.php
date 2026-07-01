<?php

use App\Enums\CompanyType;
use App\Models\Booking;
use App\Models\Company;
use App\Models\Tour;
use App\Models\User;
use App\Support\TenantCustomerGuard;
use Illuminate\Validation\ValidationException;

test('tenant customer guard rejects users registered with another agent', function () {
    $agent = Company::factory()->create(['type' => CompanyType::AGENT]);
    $otherAgent = Company::factory()->create(['type' => CompanyType::AGENT]);
    $user = User::factory()->create(['company_id' => $otherAgent->id]);
    $user->addRole('user:customer');

    expect(fn () => TenantCustomerGuard::assertCustomerOfCompany($user, $agent))
        ->toThrow(ValidationException::class);
});

test('tenant customer guard allows agent customer to access their booking', function () {
    $agent = Company::factory()->create(['type' => CompanyType::AGENT]);
    $user = User::factory()->create(['company_id' => $agent->id]);
    $user->addRole('user:customer');

    $tour = Tour::factory()->create(['company_id' => $agent->id]);

    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'agent_id' => $agent->id,
        'vendor_id' => $agent->id,
        'tour_id' => $tour->id,
    ]);

    TenantCustomerGuard::assertBookingAccessible($user, $booking, $agent);

    expect(TenantCustomerGuard::bookingBelongsToCompany($booking, $agent))->toBeTrue();
});
