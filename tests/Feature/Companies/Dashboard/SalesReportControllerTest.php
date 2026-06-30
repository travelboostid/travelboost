<?php

use App\Enums\BookingStatus;
use App\Enums\CompanyTeamStatus;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\BookingAddon;
use App\Models\BookingPassenger;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Tour;
use App\Models\TourSchedule;
use App\Models\User;
use Database\Seeders\Common\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);

    $this->owner = User::factory()->create();
    $this->agentOwner = User::factory()->create();

    $this->vendor = Company::factory()->create([
        'type' => 'vendor',
        'username' => 'vendor-sales-report',
        'name' => 'Vendor Sales Report',
    ]);

    $this->agent = Company::factory()->create([
        'type' => 'agent',
        'username' => 'agent-sales-report',
        'name' => 'Agent Alpha',
    ]);

    CompanyTeam::create([
        'company_id' => $this->vendor->id,
        'user_id' => $this->owner->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    CompanyTeam::create([
        'company_id' => $this->agent->id,
        'user_id' => $this->agentOwner->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $this->tour = Tour::factory()->create([
        'company_id' => $this->vendor->id,
        'code' => 'SALE-1001',
        'name' => 'Sales Report Tour',
    ]);

    TourSchedule::create([
        'tour_id' => $this->tour->id,
        'tour_code' => $this->tour->code,
        'company_id' => $this->vendor->id,
        'departure_date' => '2026-10-15',
        'return_date' => '2026-10-22',
        'is_active' => true,
    ]);
});

test('sales report uses the final full payment date and keeps the booking grand total intact', function () {
    $booking = Booking::factory()->create([
        'user_id' => $this->owner->id,
        'vendor_id' => $this->vendor->id,
        'agent_id' => $this->agent->id,
        'tour_id' => $this->tour->id,
        'departure_date' => '2026-10-15',
        'status' => BookingStatus::FULL_PAYMENT,
        'booking_number' => 'BOOK-SALES-001',
        'contact_name' => 'Customer Report',
        'pax_adult' => 2,
        'pax_child' => 0,
        'pax_infant' => 0,
        'total_price' => 8_000_000,
        'tax_amount' => 880_000,
        'platform_fee' => 50_000,
        'commission_amount' => 300_000,
        'grand_total' => 10_250_000,
        'created_at' => '2026-10-01 08:00:00',
    ]);

    BookingPassenger::factory()->create([
        'booking_id' => $booking->id,
        'title' => 'Mr',
        'first_name' => 'Alpha',
        'last_name' => 'One',
        'price_category' => 'Adult Double',
        'price_amount' => 4_000_000,
        'visa_type_description' => 'VOA',
        'visa_type_price' => 500_000,
        'visa_type_is_taxable' => true,
    ]);

    BookingPassenger::factory()->create([
        'booking_id' => $booking->id,
        'title' => 'Mrs',
        'first_name' => 'Beta',
        'last_name' => 'Two',
        'price_category' => 'Adult Double',
        'price_amount' => 4_000_000,
        'visa_type_description' => 'Ready Visa',
        'visa_type_price' => 250_000,
        'visa_type_is_taxable' => false,
    ]);

    BookingAddon::factory()->create([
        'booking_id' => $booking->id,
        'name' => 'Airport Transfer',
        'price' => 300_000,
        'is_taxable' => true,
    ]);

    BookingAddon::factory()->create([
        'booking_id' => $booking->id,
        'name' => 'Travel Kit',
        'price' => 120_000,
        'is_taxable' => false,
    ]);

    $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $this->owner->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 2_500_000,
        'status' => PaymentStatus::PAID,
        'paid_at' => '2026-10-05 09:00:00',
        'payload' => [
            'payment_type' => 'down_payment',
            'booking_payment_type' => 'down_payment',
            'payment_date' => '2026-10-05 09:00:00',
        ],
    ]);

    $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $this->owner->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 7_750_000,
        'status' => PaymentStatus::PAID,
        'paid_at' => '2026-10-20 11:30:00',
        'payload' => [
            'payment_type' => 'full_payment',
            'booking_payment_type' => 'full_payment',
            'payment_date' => '2026-10-20 11:30:00',
        ],
    ]);

    $response = $this->actingAs($this->owner)
        ->get("/companies/{$this->vendor->username}/dashboard/reports/sales?period_from=2026-10-20&period_to=2026-10-20");

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('companies/dashboard/reports/sales/index')
        ->has('rows', 1)
        ->where('rows.0.booking_code', 'BOOK-SALES-001')
        ->where('rows.0.agent_name', 'Agent Alpha')
        ->where('rows.0.paid_at', fn (string $value) => str_contains($value, '2026-10-20T11:30:00'))
        ->where('rows.0.base_tour_total', fn ($v) => $v == 8000000)
        ->where('rows.0.taxable_visa_total', fn ($v) => $v == 500000)
        ->where('rows.0.taxable_addon_total', fn ($v) => $v == 300000)
        ->where('rows.0.non_taxable_visa_total', fn ($v) => $v == 250000)
        ->where('rows.0.non_taxable_addon_total', fn ($v) => $v == 120000)
        ->where('rows.0.vat_amount', fn ($v) => $v == 880000)
        ->where('rows.0.platform_fee', fn ($v) => $v == 50000)
        ->where('rows.0.grand_total', fn ($v) => $v == 10250000)
        ->where('summary.total_bookings', 1)
        ->where('summary.total_pax', 2)
        ->where('summary.total_sales', fn ($v) => $v == 10250000)
        ->where('summary.total_commission', fn ($v) => $v == 300000));
});

test('sales report excludes bookings when the selected period only matches down payment dates', function () {
    $booking = Booking::factory()->create([
        'user_id' => $this->owner->id,
        'vendor_id' => $this->vendor->id,
        'agent_id' => $this->agent->id,
        'tour_id' => $this->tour->id,
        'departure_date' => '2026-10-15',
        'status' => BookingStatus::FULL_PAYMENT,
        'booking_number' => 'BOOK-SALES-002',
        'contact_name' => 'Customer Filter',
        'pax_adult' => 1,
        'pax_child' => 0,
        'pax_infant' => 0,
        'total_price' => 5_000_000,
        'tax_amount' => 550_000,
        'platform_fee' => 50_000,
        'commission_amount' => 150_000,
        'grand_total' => 6_000_000,
    ]);

    BookingPassenger::factory()->create([
        'booking_id' => $booking->id,
        'title' => 'Mr',
        'first_name' => 'Gamma',
        'last_name' => 'Three',
        'price_category' => 'Adult Single',
        'price_amount' => 5_000_000,
    ]);

    $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $this->owner->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 1_000_000,
        'status' => PaymentStatus::PAID,
        'paid_at' => '2026-10-05 09:00:00',
        'payload' => [
            'payment_type' => 'down_payment',
            'booking_payment_type' => 'down_payment',
            'payment_date' => '2026-10-05 09:00:00',
        ],
    ]);

    $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $this->owner->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 5_000_000,
        'status' => PaymentStatus::PAID,
        'paid_at' => '2026-10-28 15:45:00',
        'payload' => [
            'payment_type' => 'full_payment',
            'booking_payment_type' => 'full_payment',
            'payment_date' => '2026-10-28 15:45:00',
        ],
    ]);

    $response = $this->actingAs($this->owner)
        ->get("/companies/{$this->vendor->username}/dashboard/reports/sales?period_from=2026-10-05&period_to=2026-10-05");

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('companies/dashboard/reports/sales/index')
        ->where('rows', [])
        ->where('summary.total_bookings', 0)
        ->where('summary.total_pax', 0)
        ->where('summary.total_sales', fn ($v) => $v == 0));
});
