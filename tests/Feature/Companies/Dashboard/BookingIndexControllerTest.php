<?php

use App\Enums\BookingStatus;
use App\Enums\CompanyTeamStatus;
use App\Enums\PaymentStatus;
use App\Enums\VendorAgentPartnerStatus;
use App\Models\Booking;
use App\Models\BookingAddon;
use App\Models\BookingPassenger;
use App\Models\BookingRoom;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Payment;
use App\Models\PriceCategory;
use App\Models\Tour;
use App\Models\TourAvailability;
use App\Models\TourPrice;
use App\Models\TourSchedule;
use App\Models\User;
use App\Models\VendorAgentPartner;
use Database\Seeders\Common\RolePermissionSeeder;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);
    Booking::unsetEventDispatcher();
    DB::table('continents')->insertOrIgnore(['id' => 1, 'name' => 'Asia']);
    DB::table('regions')->insertOrIgnore(['id' => 1, 'name' => 'Southeast Asia', 'continent_id' => 1]);
    DB::table('countries')->insertOrIgnore(['id' => 1, 'name' => 'Indonesia', 'continent_id' => 1, 'region_id' => 1]);
    $this->user = User::factory()->create();
});

test('vendor can see their own bookings', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);

    Booking::factory()->count(3)->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
    ]);

    // Create a booking for another vendor — should NOT appear
    $otherVendor = Company::factory()->create(['type' => 'vendor']);
    $otherTour = Tour::factory()->create(['company_id' => $otherVendor->id]);
    Booking::factory()->create([
        'vendor_id' => $otherVendor->id,
        'tour_id' => $otherTour->id,
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('companies/dashboard/bookings/index')
        ->has('data.data', 3));
});

test('agent can see their own bookings', function () {
    $agent = Company::factory()->create(['type' => 'agent']);

    CompanyTeam::create([
        'company_id' => $agent->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);

    Booking::factory()->count(2)->create([
        'agent_id' => $agent->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
    ]);

    // Create a booking for another agent — should NOT appear
    Booking::factory()->create([
        'agent_id' => Company::factory()->create(['type' => 'agent'])->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$agent->username}/dashboard/bookings");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('companies/dashboard/bookings/index')
        ->has('data.data', 2));
});

test('agent can preview vendor invoice for full payment booking as pdf', function () {
    $agent = Company::factory()->create([
        'type' => 'agent',
        'name' => 'John Company',
        'address' => 'Jakarta',
    ]);
    $vendor = Company::factory()->create([
        'type' => 'vendor',
        'name' => 'Vendor Company',
        'address' => 'Shanghai',
    ]);

    CompanyTeam::create([
        'company_id' => $agent->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);
    VendorAgentPartner::create([
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'status' => VendorAgentPartnerStatus::ACTIVE,
        'applied_at' => now(),
        'accepted_at' => now(),
        'payment_mode' => 'agent',
    ]);

    $tour = Tour::factory()->create([
        'company_id' => $vendor->id,
        'code' => 'CHN-006',
        'name' => 'Zhangjiajie Avatar Mountain Trek',
    ]);
    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $vendor->id,
        'departure_date' => now()->addMonth()->toDateString(),
        'return_date' => now()->addMonth()->addDays(5)->toDateString(),
        'is_active' => true,
    ]);
    $category = PriceCategory::create([
        'company_id' => $vendor->id,
        'name' => 'Adult Double',
        'room_type' => 'Double',
    ]);

    TourPrice::create([
        'company_id' => $vendor->id,
        'tour_code' => $tour->code,
        'schedule_id' => $schedule->id,
        'price_category_id' => $category->id,
        'currency' => 'IDR',
        'price' => 8_800_000,
    ]);

    $booking = Booking::factory()->create([
        'user_id' => $this->user->id,
        'agent_id' => $agent->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::FULL_PAYMENT,
        'booking_number' => '0002-202605-84PTL4',
        'departure_date' => $schedule->departure_date,
        'total_price' => 8_800_000,
        'tax_amount' => 88_000,
        'platform_fee' => 25_000,
        'grand_total' => 8_913_000,
    ]);
    $booking->passengers()->create([
        'first_name' => 'Test',
        'last_name' => 'Customer',
        'price_category' => 'Adult Double',
        'price_amount' => 8_800_000,
    ]);
    $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $this->user->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 8_913_000,
        'status' => 'paid',
        'paid_at' => now(),
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$agent->username}/dashboard/bookings/{$booking->id}/invoice");

    $response->assertOk();
    $response->assertHeader('content-type', 'application/pdf');
});

test('unauthenticated users are redirected from bookings page', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    $response = $this->get("/companies/{$vendor->username}/dashboard/bookings");

    $response->assertRedirect();
});

test('users without company access are redirected', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    // User is NOT a team member of this company
    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings");

    $response->assertRedirect('/');
});

test('bookings can be filtered by booking number', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);

    Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'booking_number' => 'BKG-MATCH-12345',
    ]);

    Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'booking_number' => 'BKG-OTHER-99999',
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings?booking_number=BKG-MATCH");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('data.data', 1));
});

test('booking index includes paid amount and remaining balance', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'grand_total' => 1_000_000,
    ]);

    Payment::create([
        'owner_type' => User::class,
        'owner_id' => $this->user->id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 400_000,
        'status' => 'paid',
    ]);

    Payment::create([
        'owner_type' => User::class,
        'owner_id' => $this->user->id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 100_000,
        'status' => 'pending',
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('data.data.0.paid_amount', 400_000)
        ->where('data.data.0.remaining_balance', 600_000));
});

test('booking index exposes payment and document follow up payloads with summary counts', function () {
    $this->travelTo('2026-05-01 09:00:00');

    $vendor = Company::factory()->create(['type' => 'vendor']);
    DB::table('company_settings')->updateOrInsert(['company_id' => $vendor->id], [
        'full_payment_deadline' => 10,
        'document_completed_deadline' => 12,
    ]);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $departureDate = '2026-05-16';
    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'booking_number' => 'BKG-FOLLOW-001',
        'departure_date' => $departureDate,
        'status' => BookingStatus::DOWN_PAYMENT,
        'pax_adult' => 1,
        'pax_child' => 0,
        'pax_infant' => 0,
        'grand_total' => 1_000_000,
    ]);

    Payment::create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 400_000,
        'status' => 'paid',
    ]);

    BookingPassenger::create([
        'booking_id' => $booking->id,
        'title' => 'Mr',
        'first_name' => 'Needs',
        'last_name' => 'Docs',
        'dob' => now()->subYears(30)->toDateString(),
        'pob' => 'Jakarta',
        'price_category' => 'Adult Twin',
        'price_amount' => 1_000_000,
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('data.data.0.payment_followup.state', 'due')
        ->where('data.data.0.payment_followup.amount_due', 600_000)
        ->where('data.data.0.payment_followup.deadline', '2026-05-06')
        ->where('data.data.0.payment_followup.days_remaining', 5)
        ->where('data.data.0.payment_followup.is_overdue', false)
        ->where('data.data.0.payment_followup.action_label', 'Complete Payment')
        ->where('data.data.0.payment_followup.action_url', "/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}?date={$departureDate}&booking_number=BKG-FOLLOW-001&step=payment")
        ->where('data.data.0.document_followup.state', 'incomplete')
        ->where('data.data.0.document_followup.missing_count', 1)
        ->where('data.data.0.document_followup.deadline', '2026-05-04')
        ->where('data.data.0.document_followup.days_remaining', 3)
        ->where('data.data.0.document_followup.is_overdue', false)
        ->where('data.data.0.document_followup.action_label', 'Complete Documents')
        ->where('data.data.0.document_followup.action_url', "/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/edit?step=documents")
        ->where('followupSummary.payment_overdue', 0)
        ->where('followupSummary.payment_due_soon', 1)
        ->where('followupSummary.documents_incomplete', 1)
        ->where('followupSummary.documents_due_soon', 1));
});

test('booking index marks payment approval pending without complete payment action', function () {
    $this->travelTo('2026-05-01 09:00:00');

    $vendor = Company::factory()->create(['type' => 'vendor']);
    DB::table('company_settings')->updateOrInsert(['company_id' => $vendor->id], [
        'full_payment_deadline' => 10,
        'document_completed_deadline' => 12,
    ]);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'departure_date' => '2026-05-16',
        'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
        'grand_total' => 1_000_000,
        'payment_mode' => 'manual',
    ]);

    Payment::create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 400_000,
        'status' => 'pending',
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('data.data.0.payment_followup.state', 'pending_approval')
        ->where('data.data.0.payment_followup.label', 'Waiting Approval')
        ->where('data.data.0.payment_followup.action_url', null)
        ->where('data.data.0.payment_followup.action_label', null));
});

test('booking follow up summary excludes terminal bookings', function () {
    $this->travelTo('2026-05-01 09:00:00');

    $vendor = Company::factory()->create(['type' => 'vendor']);
    DB::table('company_settings')->updateOrInsert(['company_id' => $vendor->id], [
        'full_payment_deadline' => 20,
        'document_completed_deadline' => 20,
    ]);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    foreach ([BookingStatus::CANCELLED, BookingStatus::REFUNDED, BookingStatus::EXPIRED] as $status) {
        $booking = Booking::factory()->create([
            'vendor_id' => $vendor->id,
            'tour_id' => $tour->id,
            'departure_date' => '2026-05-10',
            'status' => $status,
            'grand_total' => 1_000_000,
        ]);
        BookingPassenger::create([
            'booking_id' => $booking->id,
            'title' => 'Mr',
            'first_name' => 'Terminal',
            'last_name' => 'Booking',
            'dob' => now()->subYears(30)->toDateString(),
            'pob' => 'Jakarta',
            'price_category' => 'Adult Twin',
            'price_amount' => 1_000_000,
        ]);
    }

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('followupSummary.payment_overdue', 0)
        ->where('followupSummary.payment_due_soon', 0)
        ->where('followupSummary.documents_incomplete', 0)
        ->where('followupSummary.documents_due_soon', 0));
});

test('booking index derives commission amount and includes payment mode', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $departureDate = now()->addMonth()->toDateString();
    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $vendor->id,
        'departure_date' => $departureDate,
        'return_date' => now()->addMonth()->addDays(5)->toDateString(),
        'is_active' => true,
    ]);
    $priceCategory = PriceCategory::create([
        'company_id' => $vendor->id,
        'name' => 'Adult Twin',
        'room_type' => 'Twin',
    ]);

    TourPrice::create([
        'company_id' => $vendor->id,
        'tour_code' => $tour->code,
        'schedule_id' => $schedule->id,
        'price_category_id' => $priceCategory->id,
        'currency' => 'IDR',
        'price' => 1_000_000,
        'commission_rate' => 10,
        'commission' => 0,
    ]);

    Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'departure_date' => $departureDate,
        'pax_adult' => 2,
        'pax_child' => 1,
        'commission_amount' => 0,
        'payment_mode' => 'manual',
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('data.data.0.commission_amount', '300000.00')
        ->where('data.data.0.payment_mode', 'manual'));
});

test('booking index derives commission from each passenger schedule price category', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $departureDate = now()->addMonth()->toDateString();
    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $vendor->id,
        'departure_date' => $departureDate,
        'return_date' => now()->addMonth()->addDays(5)->toDateString(),
        'is_active' => true,
    ]);
    $adultCategory = PriceCategory::create([
        'company_id' => $vendor->id,
        'name' => 'Adult Twin',
        'room_type' => 'Twin',
    ]);
    $childCategory = PriceCategory::create([
        'company_id' => $vendor->id,
        'name' => 'Child With Bed',
        'room_type' => 'Child',
    ]);

    TourPrice::create([
        'company_id' => $vendor->id,
        'tour_code' => $tour->code,
        'schedule_id' => $schedule->id,
        'price_category_id' => $adultCategory->id,
        'currency' => 'IDR',
        'price' => 5_000_000,
        'commission_rate' => 0,
        'commission' => 400_000,
    ]);

    TourPrice::create([
        'company_id' => $vendor->id,
        'tour_code' => $tour->code,
        'schedule_id' => $schedule->id,
        'price_category_id' => $childCategory->id,
        'currency' => 'IDR',
        'price' => 2_500_000,
        'commission_rate' => 10,
        'commission' => 0,
    ]);

    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'departure_date' => $departureDate,
        'pax_adult' => 1,
        'pax_child' => 1,
        'commission_amount' => 0,
        'payment_mode' => 'manual',
    ]);

    BookingPassenger::create([
        'booking_id' => $booking->id,
        'first_name' => 'Adult',
        'price_category' => 'Adult Twin',
        'price_amount' => 5_000_000,
    ]);
    BookingPassenger::create([
        'booking_id' => $booking->id,
        'first_name' => 'Child',
        'price_category' => 'Child With Bed',
        'price_amount' => 2_500_000,
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('data.data.0.commission_amount', '650000.00'));
});

test('booking index filters waiting payment approval and exposes manual payment proof details', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'waiting payment approval',
        'payment_mode' => 'manual',
    ]);

    $payment = Payment::create([
        'owner_type' => User::class,
        'owner_id' => $this->user->id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 500_000,
        'status' => 'pending',
        'payload' => [
            'payment_type' => 'down_payment',
            'sender_bank' => 'BCA',
            'sender_account' => '1234567890',
            'proof_path' => 'payment-proofs/proof.jpg',
        ],
    ]);

    Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'booking reserved',
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings?status=waiting%20payment%20approval");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('data.data', 1)
        ->where('data.data.0.status', 'waiting payment approval')
        ->where('data.data.0.manual_payment.id', $payment->id)
        ->where('data.data.0.manual_payment.sender_bank_name', 'BCA')
        ->where('data.data.0.manual_payment.sender_account_number', '1234567890')
        ->where('data.data.0.manual_payment.transfer_amount', 500_000)
        ->where('data.data.0.manual_payment.proof_path', 'payment-proofs/proof.jpg'));
});

test('booking index exposes manual payment review permission only for the payment receiver', function () {
    $vendorUser = User::factory()->create();
    $agentUser = User::factory()->create();
    $vendor = Company::factory()->create([
        'username' => 'reviewmodevendor',
        'type' => 'vendor',
    ]);
    $agent = Company::factory()->create([
        'username' => 'reviewmodeagent',
        'type' => 'agent',
    ]);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $vendorUser->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);
    CompanyTeam::create([
        'company_id' => $agent->id,
        'user_id' => $agentUser->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);
    VendorAgentPartner::create([
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'status' => VendorAgentPartnerStatus::ACTIVE,
        'accepted_at' => now(),
        'payment_mode' => 'agent',
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => 'waiting payment approval',
        'payment_mode' => 'manual',
    ]);

    Payment::create([
        'owner_type' => User::class,
        'owner_id' => $this->user->id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 500_000,
        'status' => 'pending',
        'payload' => [
            'payment_type' => 'down_payment',
            'sender_bank' => 'BCA',
            'sender_account' => '1234567890',
            'proof_path' => 'payment-proofs/proof.jpg',
        ],
    ]);

    $vendorResponse = $this->actingAs($vendorUser)
        ->get("/companies/{$vendor->username}/dashboard/bookings?status=waiting%20payment%20approval");

    $vendorResponse->assertOk();
    $vendorResponse->assertInertia(fn ($page) => $page
        ->has('data.data', 1)
        ->where('data.data.0.can_review_manual_payment', false));

    $agentResponse = $this->actingAs($agentUser)
        ->get("/companies/{$agent->username}/dashboard/bookings?status=waiting%20payment%20approval");

    $agentResponse->assertOk();
    $agentResponse->assertInertia(fn ($page) => $page
        ->has('data.data', 1)
        ->where('data.data.0.can_review_manual_payment', true));
});

test('booking index exposes payment receiver type for payment mode label', function () {
    $agentUser = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $agent = Company::factory()->create(['type' => 'agent']);

    CompanyTeam::create([
        'company_id' => $agent->id,
        'user_id' => $agentUser->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);
    VendorAgentPartner::create([
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'status' => VendorAgentPartnerStatus::ACTIVE,
        'accepted_at' => now(),
        'payment_mode' => 'agent',
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => 'down payment',
        'payment_mode' => 'online',
    ]);
    Payment::create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'midtrans',
        'payment_method' => 'snap',
        'amount' => 500_000,
        'status' => 'paid',
        'payload' => [
            'payment_receiver_type' => 'agent',
            'payment_receiver_company_id' => $agent->id,
        ],
    ]);

    $response = $this->actingAs($agentUser)
        ->get("/companies/{$agent->username}/dashboard/bookings");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('data.data.0.payment_mode', 'online')
        ->where('data.data.0.payment_receiver_type', 'agent'));
});

test('vendor can directly cancel an in progress booking and release availability', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $departureDate = now()->addMonth()->toDateString();
    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $vendor->id,
        'departure_date' => $departureDate,
        'return_date' => now()->addMonth()->addDays(5)->toDateString(),
        'is_active' => true,
    ]);
    $availability = TourAvailability::create([
        'company_id' => $vendor->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 10,
        'available' => 8,
        'BRS' => 2,
    ]);
    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'departure_date' => $departureDate,
        'status' => BookingStatus::BOOKING_RESERVED,
        'reserved_expires_at' => now()->addMinutes(10),
        'pax_adult' => 2,
        'pax_child' => 0,
        'pax_infant' => 0,
    ]);

    $response = $this->actingAs($this->user)
        ->post("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/cancel", [
            'reason' => 'Customer requested cancellation',
        ]);

    $response->assertRedirect();

    expect($booking->fresh()->status)->toBe(BookingStatus::CANCELLED)
        ->and($booking->fresh()->reserved_expires_at)->toBeNull()
        ->and((int) $availability->fresh()->BRS)->toBe(0)
        ->and((float) $availability->fresh()->available)->toBe(10.0);
});

test('full payment booking exposes cancel and refund actions in dashboard index', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::FULL_PAYMENT,
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('data.data.0.can_cancel', true)
        ->where('data.data.0.can_refund', true));
});

test('vendor can directly cancel a full payment booking and release availability', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $departureDate = now()->addMonth()->toDateString();
    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $vendor->id,
        'departure_date' => $departureDate,
        'return_date' => now()->addMonth()->addDays(5)->toDateString(),
        'is_active' => true,
    ]);
    $availability = TourAvailability::create([
        'company_id' => $vendor->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 10,
        'available' => 8,
        'FP' => 2,
    ]);
    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'departure_date' => $departureDate,
        'status' => BookingStatus::FULL_PAYMENT,
        'pax_adult' => 2,
        'pax_child' => 0,
        'pax_infant' => 0,
    ]);
    $payment = Payment::create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 500_000,
        'status' => 'paid',
    ]);

    $response = $this->actingAs($this->user)
        ->post("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/cancel", [
            'reason' => 'Customer requested cancellation after full payment',
        ]);

    $response->assertRedirect();

    expect($booking->fresh()->status)->toBe(BookingStatus::CANCELLED)
        ->and($payment->fresh()->status)->toBe(PaymentStatus::PAID)
        ->and((int) $availability->fresh()->FP)->toBe(0)
        ->and((int) $availability->fresh()->CA)->toBe(2)
        ->and((float) $availability->fresh()->available)->toBe(10.0);
});

test('vendor can directly refund a paid booking and release availability', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $departureDate = now()->addMonth()->toDateString();
    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $vendor->id,
        'departure_date' => $departureDate,
        'return_date' => now()->addMonth()->addDays(5)->toDateString(),
        'is_active' => true,
    ]);
    $availability = TourAvailability::create([
        'company_id' => $vendor->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 10,
        'available' => 8,
        'DP' => 2,
    ]);
    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'departure_date' => $departureDate,
        'status' => BookingStatus::DOWN_PAYMENT,
        'pax_adult' => 2,
        'pax_child' => 0,
        'pax_infant' => 0,
    ]);
    $payment = Payment::create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 500_000,
        'status' => 'paid',
    ]);

    $response = $this->actingAs($this->user)
        ->post("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/refund", [
            'reason' => 'Refund approved by vendor',
        ]);

    $response->assertRedirect();

    expect($booking->fresh()->status)->toBe(BookingStatus::REFUNDED)
        ->and($payment->fresh()->status)->toBe(PaymentStatus::REFUNDED)
        ->and((int) $availability->fresh()->DP)->toBe(0)
        ->and((int) $availability->fresh()->RF)->toBe(2)
        ->and((float) $availability->fresh()->available)->toBe(10.0);
});

test('agent cancel creates a pending vendor approval request without mutating booking', function () {
    $agentUser = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $agent = Company::factory()->create(['type' => 'agent']);

    CompanyTeam::create([
        'company_id' => $agent->id,
        'user_id' => $agentUser->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
    ]);

    $response = $this->actingAs($agentUser)
        ->post("/companies/{$agent->username}/dashboard/bookings/{$booking->id}/cancel", [
            'reason' => 'Agent requested cancellation',
        ]);

    $response->assertRedirect();

    expect($booking->fresh()->status)->toBe(BookingStatus::WAITING_PAYMENT_APPROVAL);
    $this->assertDatabaseHas('booking_action_requests', [
        'booking_id' => $booking->id,
        'requester_company_id' => $agent->id,
        'target_action' => 'cancel',
        'status' => 'pending',
    ]);
});

test('agent full payment cancel creates a pending vendor approval request without mutating booking', function () {
    $agentUser = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $agent = Company::factory()->create(['type' => 'agent']);

    CompanyTeam::create([
        'company_id' => $agent->id,
        'user_id' => $agentUser->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::FULL_PAYMENT,
    ]);

    $response = $this->actingAs($agentUser)
        ->post("/companies/{$agent->username}/dashboard/bookings/{$booking->id}/cancel", [
            'reason' => 'Agent requested full payment cancellation',
        ]);

    $response->assertRedirect();

    expect($booking->fresh()->status)->toBe(BookingStatus::FULL_PAYMENT);
    $this->assertDatabaseHas('booking_action_requests', [
        'booking_id' => $booking->id,
        'requester_company_id' => $agent->id,
        'target_action' => 'cancel',
        'status' => 'pending',
    ]);
});

test('vendor can approve and reject agent cancel refund requests', function () {
    $vendorUser = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $agent = Company::factory()->create(['type' => 'agent']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $vendorUser->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $bookingToApprove = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::DOWN_PAYMENT,
    ]);
    $bookingToReject = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
    ]);
    DB::table('booking_action_requests')->insert([
        [
            'id' => 1001,
            'booking_id' => $bookingToApprove->id,
            'requester_company_id' => $agent->id,
            'requester_user_id' => $this->user->id,
            'target_action' => 'refund',
            'status' => 'pending',
            'reason' => 'Refund requested',
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'id' => 1002,
            'booking_id' => $bookingToReject->id,
            'requester_company_id' => $agent->id,
            'requester_user_id' => $this->user->id,
            'target_action' => 'cancel',
            'status' => 'pending',
            'reason' => 'Cancel requested',
            'created_at' => now(),
            'updated_at' => now(),
        ],
    ]);

    $indexResponse = $this->actingAs($vendorUser)
        ->get("/companies/{$vendor->username}/dashboard/booking-action-requests");

    $indexResponse->assertOk();
    $indexResponse->assertInertia(fn ($page) => $page
        ->component('companies/dashboard/bookings/action-requests')
        ->has('requests.data', 2));

    $approveResponse = $this->actingAs($vendorUser)
        ->post("/companies/{$vendor->username}/dashboard/booking-action-requests/1001/approve");
    $rejectResponse = $this->actingAs($vendorUser)
        ->post("/companies/{$vendor->username}/dashboard/booking-action-requests/1002/reject");

    $approveResponse->assertRedirect();
    $rejectResponse->assertRedirect();

    expect($bookingToApprove->fresh()->status)->toBe(BookingStatus::REFUNDED)
        ->and($bookingToReject->fresh()->status)->toBe(BookingStatus::WAITING_PAYMENT_APPROVAL);
    $this->assertDatabaseHas('booking_action_requests', [
        'id' => 1001,
        'status' => 'approved',
        'reviewer_company_id' => $vendor->id,
        'reviewer_user_id' => $vendorUser->id,
    ]);
    $this->assertDatabaseHas('booking_action_requests', [
        'id' => 1002,
        'status' => 'rejected',
        'reviewer_company_id' => $vendor->id,
        'reviewer_user_id' => $vendorUser->id,
    ]);
});

test('availability save preserves manual reserved and recomputes booking reserved from bookings', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $departureDate = now()->addMonth()->toDateString();
    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $vendor->id,
        'departure_date' => $departureDate,
        'return_date' => now()->addMonth()->addDays(5)->toDateString(),
        'is_active' => true,
    ]);
    $availability = TourAvailability::create([
        'company_id' => $vendor->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 10,
        'RS' => 1,
        'available' => 9,
    ]);

    Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'departure_date' => $departureDate,
        'status' => BookingStatus::BOOKING_RESERVED,
        'reserved_type' => 'system',
        'reserved_expires_at' => now()->addMinutes(10),
        'pax_adult' => 2,
        'pax_child' => 1,
        'pax_infant' => 1,
    ]);

    $response = $this->actingAs($this->user)
        ->post("/companies/{$vendor->username}/dashboard/tour-availabilities", [
            'availabilities' => [
                [
                    'tour_id' => $tour->id,
                    'schedule_id' => $schedule->id,
                    'max_pax' => 10,
                    'RS' => 2,
                    'BRS' => 99,
                    'DP' => 99,
                    'available' => 99,
                ],
            ],
        ]);

    $response->assertRedirect();

    $availability->refresh();

    expect((int) $availability->RS)->toBe(2)
        ->and((int) $availability->BRS)->toBe(4)
        ->and((int) $availability->DP)->toBe(0)
        ->and((float) $availability->available)->toBe(4.0);
});

test('booking show includes room bed layout data', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $vendor->companySetting()->create(['minimum_down_payment' => 20]);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
    ]);

    BookingRoom::create([
        'booking_id' => $booking->id,
        'room_type' => 'twin',
        'room_label' => 'Twin Room 1',
        'bed_layout' => [
            ['bedType' => 'twin', 'guestId' => 'adult-0'],
            ['bedType' => 'twin', 'guestId' => 'adult-1'],
        ],
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('minimumDownPaymentPct', 20)
        ->where('booking.rooms.0.room_type', 'twin')
        ->where('booking.rooms.0.room_label', 'Twin Room 1')
        ->where('booking.rooms.0.bed_layout.0.guestId', 'adult-0')
        ->where('booking.rooms.0.bed_layout.1.guestId', 'adult-1'));
});

test('vendor can update booking wizard data dynamically', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $departureDate = now()->addDays(20)->toDateString();
    $schedule = TourSchedule::create([
        'company_id' => $vendor->id,
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'departure_date' => $departureDate,
        'return_date' => now()->addDays(25)->toDateString(),
        'is_active' => true,
    ]);
    $adultTwin = PriceCategory::create([
        'company_id' => $vendor->id,
        'name' => 'Adult Twin',
        'room_type' => 'twin',
    ]);
    TourPrice::create([
        'company_id' => $vendor->id,
        'tour_code' => $tour->code,
        'schedule_id' => $schedule->id,
        'price_category_id' => $adultTwin->id,
        'currency' => 'IDR',
        'price' => 1_000_000,
        'promotion' => 100_000,
    ]);
    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'departure_date' => $departureDate,
        'status' => BookingStatus::RESERVED,
        'pax_adult' => 1,
        'pax_child' => 0,
        'pax_infant' => 0,
        'total_price' => 1_000_000,
        'tax_amount' => 110_000,
        'platform_fee' => 25_000,
        'commission_amount' => 0,
        'grand_total' => 1_135_000,
    ]);
    $passenger = BookingPassenger::factory()->create([
        'booking_id' => $booking->id,
        'first_name' => 'Old',
        'last_name' => 'Guest',
        'price_category' => 'Adult Single',
        'price_amount' => 1_000_000,
        'room_type' => 'Single',
    ]);
    BookingRoom::create([
        'booking_id' => $booking->id,
        'room_type' => 'single',
        'room_label' => 'Single Room 1',
        'bed_layout' => [['bedType' => 'single', 'guestId' => 'adult-0']],
    ]);
    BookingAddon::factory()->create([
        'booking_id' => $booking->id,
        'name' => 'Old Addon',
        'price' => 100_000,
    ]);

    $response = $this->actingAs($this->user)
        ->put("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}", [
            'contact_name' => 'Updated Customer',
            'contact_email' => 'updated@example.test',
            'contact_phone' => '08123456789',
            'contact_notes' => 'Updated from dashboard',
            'pax_adult' => 2,
            'pax_child' => 0,
            'pax_infant' => 0,
            'total_price' => 2_000_000,
            'tax_amount' => 220_000,
            'platform_fee' => 50_000,
            'commission_amount' => 100_000,
            'grand_total' => 2_370_000,
            'passengers' => [
                [
                    'id' => $passenger->id,
                    'title' => 'Mr',
                    'first_name' => 'Updated',
                    'last_name' => 'Guest',
                    'gender' => 'male',
                    'dob' => '1990-01-01',
                    'pob' => 'Jakarta',
                    'nationality' => 'Indonesia',
                    'passport_number' => 'A1234567',
                    'passport_issue_date' => '2024-01-01',
                    'passport_expiry_date' => '2030-01-01',
                    'visa_number' => 'VISA-1',
                    'price_category' => 'Adult Twin',
                    'price_amount' => 1_000_000,
                    'room_type' => 'Twin',
                    'room_number' => '1',
                    'note' => 'Window side',
                ],
                [
                    'title' => 'Ms',
                    'first_name' => 'New',
                    'last_name' => 'Guest',
                    'gender' => 'female',
                    'dob' => '1992-02-02',
                    'pob' => 'Bandung',
                    'price_category' => 'Adult Twin',
                    'price_amount' => 1_000_000,
                    'room_type' => 'Twin',
                    'room_number' => '1',
                ],
            ],
            'rooms' => [
                [
                    'room_type' => 'twin',
                    'room_label' => 'Twin Room 1',
                    'bed_layout' => [
                        ['bedType' => 'twin', 'guestId' => 'adult-0'],
                        ['bedType' => 'twin', 'guestId' => 'adult-1'],
                    ],
                ],
            ],
            'addons' => [
                ['name' => 'VISA', 'price' => 500_000],
            ],
        ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect();

    $booking->refresh();

    expect($booking->contact_name)->toBe('Updated Customer')
        ->and($booking->pax_adult)->toBe(2)
        ->and((float) $booking->total_price)->toBe(2_000_000.0)
        ->and((float) $booking->tax_amount)->toBe(198_000.0)
        ->and((float) $booking->grand_total)->toBe(2_548_000.0)
        ->and((float) $booking->commission_amount)->toBe(0.0)
        ->and((float) $booking->passengers()->where('first_name', 'Updated')->first()->price_amount)->toBe(900_000.0)
        ->and($booking->passengers)->toHaveCount(2)
        ->and($booking->rooms)->toHaveCount(1)
        ->and($booking->addons)->toHaveCount(1)
        ->and($booking->rooms()->first()->bed_layout)->toBe([
            ['bedType' => 'twin', 'guestId' => 'adult-0'],
            ['bedType' => 'twin', 'guestId' => 'adult-1'],
        ])
        ->and($booking->passengers()->where('first_name', 'Updated')->first()->room_number)->toBe('1')
        ->and($booking->addons()->first()->name)->toBe('VISA')
        ->and((float) $booking->addons()->first()->price)->toBe(500_000.0);
});

test('booking edit exposes customer wizard payment props for dashboard', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $vendor->companySetting()->create([
        'minimum_down_payment' => 25,
        'minimum_vat' => 11,
        'manual_bank_transfer' => 'Mandiri',
        'manual_bank_transfer_account_name' => 'Vendor Receiver',
        'manual_bank_transfer_account_number' => '112233',
    ]);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $vendor->id,
        'departure_date' => now()->addMonth()->toDateString(),
        'return_date' => now()->addMonth()->addDays(5)->toDateString(),
        'is_active' => true,
    ]);
    TourAvailability::create([
        'company_id' => $vendor->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 5,
        'available' => 4,
    ]);

    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'status' => BookingStatus::AWAITING_PAYMENT,
        'pax_adult' => 1,
        'pax_child' => 0,
        'pax_infant' => 0,
        'grand_total' => 1_000_000,
    ]);
    BookingPassenger::create([
        'booking_id' => $booking->id,
        'title' => 'Mr',
        'first_name' => 'Existing',
        'last_name' => 'Passenger',
        'dob' => now()->subYears(30)->toDateString(),
        'pob' => 'Jakarta',
        'price_category' => 'Adult Twin',
        'price_amount' => 1_000_000,
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/edit");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('companies/dashboard/bookings/edit')
        ->where('editMode', 'full')
        ->where('downPaymentAvailable', true)
        ->where('minimumDownPaymentPct', 25)
        ->where('platformFeePerPax', 25000)
        ->where('vendorBankInfo.bankName', 'Mandiri')
        ->where('bookingSeatLimit', 4));
});

test('full payment booking with incomplete documents allows dashboard document-only updates', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::FULL_PAYMENT,
        'departure_date' => now()->addMonth()->toDateString(),
        'pax_adult' => 1,
        'pax_child' => 0,
        'pax_infant' => 0,
    ]);
    $passenger = BookingPassenger::create([
        'booking_id' => $booking->id,
        'title' => 'Ms',
        'first_name' => 'Needs',
        'last_name' => 'Docs',
        'dob' => now()->subYears(28)->toDateString(),
        'pob' => 'Bandung',
        'price_category' => 'Adult Twin',
        'price_amount' => 1_000_000,
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/edit");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('companies/dashboard/bookings/edit')
        ->where('editMode', 'documents')
        ->where('canEditDocuments', true));

    $this->actingAs($this->user)
        ->put("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}", [
            'contact_name' => 'Should Not Update',
        ])
        ->assertForbidden();

    $this->actingAs($this->user)
        ->post("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/travel-documents", [
            'passengers' => [[
                'id' => $passenger->id,
                'passport_number' => 'A1234567',
                'passport_issue_date' => now()->subYear()->toDateString(),
                'passport_expiry_date' => now()->addYears(4)->toDateString(),
                'passport_file_path' => 'travel-documents/passports/a.pdf',
                'visa_number' => 'V123',
                'visa_file_path' => 'travel-documents/visas/v.pdf',
            ]],
        ])
        ->assertRedirect();

    $passenger->refresh();
    expect($passenger->passport_number)->toBe('A1234567')
        ->and($passenger->visa_number)->toBe('V123');
});

test('down payment booking with incomplete documents allows dashboard document-only updates', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::DOWN_PAYMENT,
        'departure_date' => now()->addMonth()->toDateString(),
        'pax_adult' => 1,
        'pax_child' => 0,
        'pax_infant' => 0,
    ]);
    BookingPassenger::create([
        'booking_id' => $booking->id,
        'title' => 'Ms',
        'first_name' => 'Needs',
        'last_name' => 'Docs',
        'dob' => now()->subYears(28)->toDateString(),
        'pob' => 'Bandung',
        'price_category' => 'Adult Twin',
        'price_amount' => 1_000_000,
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/edit");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('companies/dashboard/bookings/edit')
        ->where('editMode', 'documents')
        ->where('canEditDocuments', true));
});

test('full payment booking with complete documents stays read only in dashboard edit', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::FULL_PAYMENT,
    ]);
    BookingPassenger::create([
        'booking_id' => $booking->id,
        'title' => 'Mr',
        'first_name' => 'Complete',
        'last_name' => 'Docs',
        'dob' => now()->subYears(30)->toDateString(),
        'pob' => 'Jakarta',
        'price_category' => 'Adult Twin',
        'price_amount' => 1_000_000,
        'passport_number' => 'P123',
        'passport_issue_date' => now()->subYear()->toDateString(),
        'passport_expiry_date' => now()->addYears(4)->toDateString(),
        'passport_file_path' => 'travel-documents/passports/p.pdf',
        'visa_number' => 'V123',
        'visa_file_path' => 'travel-documents/visas/v.pdf',
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/edit");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('companies/dashboard/bookings/edit')
        ->where('editMode', 'readonly')
        ->where('canEditDocuments', false));
});
