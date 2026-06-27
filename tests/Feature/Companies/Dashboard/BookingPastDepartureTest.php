<?php

use App\Enums\BookingStatus;
use App\Enums\CompanyTeamStatus;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Payment;
use App\Models\Tour;
use App\Models\User;
use Database\Seeders\Common\RolePermissionSeeder;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

beforeEach(function () {
    /** @var TestCase $this */
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);
    Booking::unsetEventDispatcher();
    DB::table('continents')->insertOrIgnore(['id' => 1, 'name' => 'Asia']);
    DB::table('regions')->insertOrIgnore(['id' => 1, 'name' => 'Southeast Asia', 'continent_id' => 1]);
    DB::table('countries')->insertOrIgnore(['id' => 1, 'name' => 'Indonesia', 'continent_id' => 1, 'region_id' => 1]);
    $this->user = User::factory()->create();
    $this->travelTo('2026-06-26 12:00:00');
});

function attachPastDepartureVendorTeam(User $user, Company $vendor): void
{
    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);
}

function createPastDepartureBooking(BookingStatus $status = BookingStatus::FULL_PAYMENT): array
{
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => $status,
        'departure_date' => now()->subDay()->toDateString(),
        'grand_total' => 10_000_000,
    ]);

    if (in_array($status, [BookingStatus::DOWN_PAYMENT, BookingStatus::FULL_PAYMENT], true)) {
        Payment::create([
            'owner_type' => User::class,
            'owner_id' => User::factory()->create()->id,
            'payable_type' => Booking::class,
            'payable_id' => $booking->id,
            'provider' => 'manual',
            'payment_method' => 'bank_transfer',
            'amount' => $status === BookingStatus::FULL_PAYMENT ? 10_000_000 : 2_000_000,
            'status' => PaymentStatus::PAID,
            'payload' => [
                'payment_type' => $status === BookingStatus::FULL_PAYMENT ? 'full_payment' : 'down_payment',
            ],
        ]);
    }

    return compact('vendor', 'tour', 'booking');
}

test('past departure booking row actions only allow read-only operations', function () {
    ['vendor' => $vendor, 'booking' => $booking] = createPastDepartureBooking();
    attachPastDepartureVendorTeam($this->user, $vendor);

    $this->actingAs($this->user)
        ->getJson("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/row-actions")
        ->assertOk()
        ->assertJsonPath('can_cancel', false)
        ->assertJsonPath('can_refund', false)
        ->assertJsonPath('can_reschedule', false)
        ->assertJsonPath('can_edit', false)
        ->assertJsonPath('departure_has_passed', true)
        ->assertJson(fn ($json) => collect($json['invoice_options'] ?? [])->isNotEmpty());
});

test('future departure booking row actions remain manageable', function () {
    ['vendor' => $vendor, 'booking' => $booking] = createPastDepartureBooking();
    $booking->update(['departure_date' => now()->addMonth()->toDateString()]);
    attachPastDepartureVendorTeam($this->user, $vendor);

    $this->actingAs($this->user)
        ->getJson("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/row-actions")
        ->assertOk()
        ->assertJsonPath('can_cancel', true)
        ->assertJsonPath('can_refund', true)
        ->assertJsonPath('can_edit', true)
        ->assertJsonPath('departure_has_passed', false);
});

test('vendor cannot cancel booking after departure date has passed', function () {
    ['vendor' => $vendor, 'booking' => $booking] = createPastDepartureBooking();
    attachPastDepartureVendorTeam($this->user, $vendor);

    $this->actingAs($this->user)
        ->post("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/cancel", [
            'reason' => 'Customer request',
        ])
        ->assertSessionHasErrors('booking_action');

    expect($booking->fresh()->status)->toBe(BookingStatus::FULL_PAYMENT);
});

test('vendor cannot refund booking after departure date has passed', function () {
    ['vendor' => $vendor, 'booking' => $booking] = createPastDepartureBooking();
    attachPastDepartureVendorTeam($this->user, $vendor);

    $this->actingAs($this->user)
        ->post("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/refund", [
            'reason' => 'Customer request',
        ])
        ->assertSessionHasErrors('booking_action');

    expect($booking->fresh()->status)->toBe(BookingStatus::FULL_PAYMENT);
});

test('booking edit page is read only after departure date has passed', function () {
    ['vendor' => $vendor, 'booking' => $booking] = createPastDepartureBooking(BookingStatus::DOWN_PAYMENT);
    attachPastDepartureVendorTeam($this->user, $vendor);

    $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/edit")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('editMode', 'readonly')
            ->where('canEditDocuments', false)
            ->where('departureHasPassed', true));
});

test('vendor can still view booking detail and invoice after departure date has passed', function () {
    ['vendor' => $vendor, 'booking' => $booking] = createPastDepartureBooking();
    attachPastDepartureVendorTeam($this->user, $vendor);

    $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}")
        ->assertOk();

    $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/invoice")
        ->assertOk();
});

test('past departure booking hides document and payment followup action urls', function () {
    ['vendor' => $vendor, 'booking' => $booking] = createPastDepartureBooking(BookingStatus::DOWN_PAYMENT);
    attachPastDepartureVendorTeam($this->user, $vendor);

    $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('data.data.0.payment_followup.action_url', null)
            ->where('data.data.0.document_followup.action_url', null));
});
