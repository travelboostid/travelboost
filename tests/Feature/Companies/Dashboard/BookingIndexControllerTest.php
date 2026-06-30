<?php

use App\Enums\BookingStatus;
use App\Enums\CompanyTeamStatus;
use App\Enums\PaymentStatus;
use App\Enums\VendorAgentPartnerStatus;
use App\Models\AgentSubscriptionPackage;
use App\Models\AgentTier;
use App\Models\AgentTour;
use App\Models\Booking;
use App\Models\BookingActionRequest;
use App\Models\BookingAddon;
use App\Models\BookingPassenger;
use App\Models\BookingRoom;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Payment;
use App\Models\PriceCategory;
use App\Models\ProductCommissionCategory;
use App\Models\Role;
use App\Models\Tour;
use App\Models\TourAvailability;
use App\Models\TourCommissionRule;
use App\Models\TourPrice;
use App\Models\TourSchedule;
use App\Models\User;
use App\Models\VendorAgentPartner;
use Carbon\Carbon;
use Database\Seeders\Common\RolePermissionSeeder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

function createBookingWithSchedule($count = 1, $attributes = [])
{
    $bookings = Booking::factory()->count($count)->create($attributes);
    $collection = $bookings instanceof Collection ? $bookings : collect([$bookings]);

    foreach ($collection as $booking) {
        $schedule = TourSchedule::firstOrCreate([
            'tour_id' => $booking->tour_id,
            'departure_date' => $booking->departure_date,
        ], [
            'tour_code' => $booking->tour->code ?? 'CODE',
            'company_id' => $booking->vendor_id,
            'return_date' => Carbon::parse($booking->departure_date)->addDays(7)->toDateString(),
            'is_active' => true,
        ]);

        TourAvailability::firstOrCreate([
            'schedule_id' => $schedule->id,
        ], [
            'company_id' => $booking->vendor_id,
            'tour_id' => $booking->tour_id,
            'max_pax' => 50,
            'available' => 50,
        ]);
    }

    return $count === 1 ? $collection->first() : $collection;
}

beforeEach(function () {
    /** @var TestCase $this */
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

    createBookingWithSchedule(3, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
    ]);

    // Create a booking for another vendor — should NOT appear
    $otherVendor = Company::factory()->create(['type' => 'vendor']);
    $otherTour = Tour::factory()->create(['company_id' => $otherVendor->id]);
    createBookingWithSchedule(1, [
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

    createBookingWithSchedule(2, [
        'agent_id' => $agent->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
    ]);

    // Create a booking for another agent — should NOT appear
    createBookingWithSchedule(1, [
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

test('dashboard bookings index paginates ten bookings per page and preserves filters', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);

    createBookingWithSchedule(12, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::DOWN_PAYMENT,
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings?status=down%20payment");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('companies/dashboard/bookings/index')
        ->has('data.data', 10)
        ->where('data.per_page', 10)
        ->where('data.total', 12)
        ->where('data.current_page', 1)
        ->where('data.last_page', 2)
        ->where('data.next_page_url', fn (?string $url): bool => $url !== null && str_contains($url, 'status=down%20payment')));
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

    $booking = createBookingWithSchedule(1, [
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

    createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'booking_number' => 'BKG-MATCH-12345',
    ]);

    createBookingWithSchedule(1, [
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

test('booking index supports unified search across booking fields', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create([
        'company_id' => $vendor->id,
        'name' => 'Mountain Explorer',
    ]);

    createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'booking_number' => 'BKG-SEARCH-001',
        'contact_name' => 'Search Customer',
    ]);

    $otherTour = Tour::factory()->create([
        'company_id' => $vendor->id,
        'name' => 'Beach Holiday',
    ]);

    createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $otherTour->id,
        'booking_number' => 'BKG-OTHER-002',
        'contact_name' => 'Other Customer',
    ]);

    $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings?search=Mountain")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('data.data', 1)
            ->where('data.data.0.booking_number', 'BKG-SEARCH-001')
            ->where('filters.search', 'Mountain'));

    $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings?search=SEARCH-001")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('data.data', 1)
            ->where('data.data.0.booking_number', 'BKG-SEARCH-001'));

    $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings?search=Search")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('data.data', 1)
            ->where('data.data.0.contact_name', 'Search Customer')
            ->where('filters.search', 'Search'));
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
    $booking = createBookingWithSchedule(1, [
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

test('dashboard booking payload reconciles stale grand total with persisted add ons', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $vendor->companySetting()->create(['minimum_vat' => 1.1]);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create([
        'company_id' => $vendor->id,
        'code' => 'ADDON-DASHBOARD',
        'status' => 'active',
    ]);
    $schedule = TourSchedule::create([
        'company_id' => $vendor->id,
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'departure_date' => now()->addMonths(6)->toDateString(),
        'return_date' => now()->addMonths(6)->addDays(7)->toDateString(),
        'is_active' => true,
    ]);
    $priceCategory = PriceCategory::create([
        'company_id' => $vendor->id,
        'name' => 'Adult Single',
        'room_type' => 'single',
    ]);
    TourPrice::create([
        'company_id' => $vendor->id,
        'tour_code' => $tour->code,
        'schedule_id' => $schedule->id,
        'price_category_id' => $priceCategory->id,
        'currency' => 'IDR',
        'price' => 16_700_000,
    ]);

    $staleGrandTotal = 33_817_400;
    $expectedGrandTotal = 37_273_400;
    $booking = createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'status' => BookingStatus::BOOKING_RESERVED,
        'reserved_expires_at' => now()->addMinutes(20),
        'pax_adult' => 2,
        'pax_child' => 0,
        'pax_infant' => 0,
        'total_price' => 33_400_000,
        'tax_rate' => 1.1,
        'tax_amount' => 367_400,
        'platform_fee' => 50_000,
        'commission_amount' => 0,
        'grand_total' => $staleGrandTotal,
    ]);
    $booking->passengers()->createMany([
        [
            'first_name' => 'First',
            'last_name' => 'Guest',
            'price_category' => 'Adult Single',
            'price_amount' => 16_700_000,
            'room_type' => 'Single',
        ],
        [
            'first_name' => 'Second',
            'last_name' => 'Guest',
            'price_category' => 'Adult Single',
            'price_amount' => 16_700_000,
            'room_type' => 'Single',
        ],
    ]);
    $booking->addons()->createMany([
        ['name' => 'VISA GROUP', 'price' => 1_960_000],
        ['name' => 'Tipping', 'price' => 1_496_000],
    ]);

    $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('companies/dashboard/bookings/index')
            ->where('data.data.0.booking_number', $booking->booking_number)
            ->where('data.data.0.grand_total', fn (mixed $value): bool => (float) $value === (float) $expectedGrandTotal)
            ->where('data.data.0.remaining_balance', $expectedGrandTotal));

    expect((float) $booking->fresh()->grand_total)->toBe((float) $expectedGrandTotal);

    $booking->update(['grand_total' => $staleGrandTotal]);

    $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('companies/dashboard/bookings/show')
            ->where('booking.grand_total', fn (mixed $value): bool => (float) $value === (float) $expectedGrandTotal)
            ->where('remainingBalance', $expectedGrandTotal));
});

test('dashboard booking create payload exposes effective commission per active agent', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $matrixAgent = Company::factory()->create(['type' => 'agent']);
    $fallbackAgent = Company::factory()->create(['type' => 'agent']);
    $package = AgentSubscriptionPackage::factory()->create(['id' => 2]);

    foreach ([$matrixAgent, $fallbackAgent] as $agent) {
        $agent->agentSubscription()->create([
            'package_id' => $package->id,
            'started_at' => now()->subDay(),
            'ended_at' => now()->addYear(),
        ]);
    }

    $tier = AgentTier::create([
        'company_id' => $vendor->id,
        'name' => 'Gold',
        'slug' => 'gold',
        'sort_order' => 1,
        'is_active' => true,
    ]);
    $category = ProductCommissionCategory::create([
        'company_id' => $vendor->id,
        'category_name' => 'Group Tour',
        'slug' => 'group-tour',
        'sort_order' => 1,
        'is_active' => true,
    ]);

    $tour = Tour::factory()->create([
        'company_id' => $vendor->id,
        'code' => 'PREVIEW-COMM',
        'status' => 'active',
        'product_commission_category_id' => $category->id,
    ]);
    $schedule = TourSchedule::create([
        'company_id' => $vendor->id,
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'departure_date' => now()->addMonths(6)->toDateString(),
        'return_date' => now()->addMonths(6)->addDays(7)->toDateString(),
        'is_active' => true,
    ]);
    TourAvailability::create([
        'company_id' => $vendor->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 10,
        'available' => 10,
    ]);
    $priceCategory = PriceCategory::create([
        'company_id' => $vendor->id,
        'name' => 'Adult Single',
        'room_type' => 'single',
    ]);
    TourPrice::create([
        'company_id' => $vendor->id,
        'tour_code' => $tour->code,
        'schedule_id' => $schedule->id,
        'price_category_id' => $priceCategory->id,
        'currency' => 'IDR',
        'price' => 10_000_000,
        'commission' => 0,
        'commission_rate' => 12,
    ]);
    TourCommissionRule::create([
        'company_id' => $vendor->id,
        'tour_id' => null,
        'agent_tier_id' => $tier->id,
        'product_commission_category_id' => $category->id,
        'commission_type' => 'fixed',
        'commission_value' => 750_000,
        'is_active' => true,
    ]);

    VendorAgentPartner::create([
        'vendor_id' => $vendor->id,
        'agent_id' => $matrixAgent->id,
        'agent_tier_id' => $tier->id,
        'status' => VendorAgentPartnerStatus::ACTIVE,
    ]);
    VendorAgentPartner::create([
        'vendor_id' => $vendor->id,
        'agent_id' => $fallbackAgent->id,
        'agent_tier_id' => null,
        'status' => VendorAgentPartnerStatus::ACTIVE,
    ]);

    foreach ([$matrixAgent, $fallbackAgent] as $agent) {
        AgentTour::create([
            'company_id' => $agent->id,
            'tour_id' => $tour->id,
            'status' => 'active',
        ]);
    }

    $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}?date={$schedule->departure_date}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('tours/bookings/create')
            ->where('tourPrices.0.agentCommissionsByAgentId', function (mixed $commissions) use ($matrixAgent, $fallbackAgent): bool {
                $commissions = collect($commissions);

                return (float) ($commissions[$matrixAgent->id] ?? 0) === 750_000.0
                    && (float) ($commissions[$fallbackAgent->id] ?? 0) === 1_200_000.0;
            }));
});

test('booking index exposes down payment and full payment details', function () {
    $this->travelTo('2026-05-01 09:00:00');

    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::FULL_PAYMENT,
        'grand_total' => 1_500_000,
    ]);

    Payment::create([
        'owner_type' => User::class,
        'owner_id' => $this->user->id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 500_000,
        'status' => PaymentStatus::PAID,
        'paid_at' => now()->subDays(3),
        'payload' => [
            'payment_type' => 'down_payment',
            'payment_date' => '2026-04-28',
            'payment_receiver_type' => 'vendor',
            'proof_path' => 'payment-proofs/down-payment.jpg',
        ],
    ]);

    Payment::create([
        'owner_type' => User::class,
        'owner_id' => $this->user->id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'midtrans',
        'payment_method' => 'snap',
        'amount' => 1_000_000,
        'status' => PaymentStatus::PAID,
        'paid_at' => '2026-05-01 10:00:00',
        'payload' => [
            'booking_payment_type' => 'full_payment',
            'payment_type' => 'full_payment',
            'payment_receiver_type' => 'vendor',
            'midtrans' => [
                'payment_type' => 'bank_transfer',
                'order_id' => 'full-order-123',
                'transaction_id' => 'midtrans-transaction-123',
                'transaction_status' => 'settlement',
            ],
        ],
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('data.data.0.down_payment_detail.method_label', 'Manual payment')
        ->where('data.data.0.down_payment_detail.receiver_label', 'vendor')
        ->where('data.data.0.down_payment_detail.amount', 500000)
        ->where('data.data.0.down_payment_detail.payment_date', '2026-04-28')
        ->where('data.data.0.down_payment_detail.receipt.type', 'manual')
        ->where('data.data.0.down_payment_detail.receipt.url', Storage::disk('public')->url('payment-proofs/down-payment.jpg'))
        ->where('data.data.0.full_payment_detail.method_label', 'Online payment')
        ->where('data.data.0.full_payment_detail.receiver_label', 'vendor')
        ->where('data.data.0.full_payment_detail.amount', 1000000)
        ->where('data.data.0.full_payment_detail.payment_date', '2026-05-01T10:00:00.000000Z')
        ->where('data.data.0.full_payment_detail.receipt.type', 'online')
        ->where('data.data.0.full_payment_detail.receipt.order_id', 'full-order-123')
        ->where('data.data.0.full_payment_detail.receipt.transaction_id', 'midtrans-transaction-123')
        ->where('data.data.0.full_payment_detail.receipt.status', 'settlement'));
});

test('booking index sums multiple full payments and exposes grouped receipts after reschedule top-up', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::FULL_PAYMENT,
        'grand_total' => 14_625_000,
    ]);

    Payment::create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'midtrans',
        'payment_method' => 'snap',
        'amount' => 10_125_000,
        'status' => PaymentStatus::PAID,
        'paid_at' => '2026-06-01 10:00:00',
        'payload' => [
            'payment_type' => 'full_payment',
            'payment_receiver_type' => 'vendor',
            'midtrans' => [
                'order_id' => 'original-full-order',
                'transaction_id' => 'original-full-tx',
                'transaction_status' => 'settlement',
            ],
        ],
    ]);

    Payment::create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'midtrans',
        'payment_method' => 'snap',
        'amount' => 4_500_000,
        'status' => PaymentStatus::PAID,
        'paid_at' => '2026-06-22 10:00:00',
        'payload' => [
            'payment_type' => 'full_payment',
            'payment_receiver_type' => 'vendor',
            'midtrans' => [
                'order_id' => 'reschedule-top-up-order',
                'transaction_id' => 'reschedule-top-up-tx',
                'transaction_status' => 'settlement',
            ],
        ],
    ]);

    BookingActionRequest::create([
        'booking_id' => $booking->id,
        'requester_company_id' => $vendor->id,
        'requester_user_id' => $this->user->id,
        'target_action' => 'reschedule',
        'status' => 'approved',
        'reason' => 'Customer requested new date',
        'reviewer_company_id' => $vendor->id,
        'reviewer_user_id' => $this->user->id,
        'reviewed_at' => now(),
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('data.data.0.full_payment_detail.amount', 14_625_000)
        ->where('data.data.0.full_payment_detail.receipt_group.0.title', 'Original Full Payment')
        ->where('data.data.0.full_payment_detail.receipt_group.1.title', 'Additional Payment (Reschedule)')
        ->where('data.data.0.full_payment_detail.receipt_group.0.detail.amount', 10_125_000)
        ->where('data.data.0.full_payment_detail.receipt_group.1.detail.amount', 4_500_000)
        ->where('data.data.0.was_rescheduled', true));
});

test('booking index infers legacy paid midtrans full payment detail when payment type is missing', function () {
    $this->travelTo('2026-05-01 09:00:00');

    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::FULL_PAYMENT,
        'grand_total' => 1_500_000,
    ]);

    Payment::create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 500_000,
        'status' => PaymentStatus::PAID,
        'paid_at' => '2026-04-28 09:00:00',
        'payload' => [
            'payment_type' => 'down_payment',
            'payment_receiver_type' => 'vendor',
        ],
    ]);

    Payment::create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'midtrans',
        'payment_method' => 'snap',
        'amount' => 1_000_000,
        'status' => PaymentStatus::PAID,
        'paid_at' => '2026-05-01 10:00:00',
        'payload' => [
            'payment_receiver_type' => 'vendor',
        ],
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('data.data.0.full_payment_detail.method_label', 'Online payment')
        ->where('data.data.0.full_payment_detail.receiver_label', 'vendor')
        ->where('data.data.0.full_payment_detail.amount', 1000000)
        ->where('data.data.0.full_payment_detail.payment_date', '2026-05-01T10:00:00.000000Z'));
});

test('booking index infers paid midtrans full payment detail when gateway overwrites payment type', function () {
    $this->travelTo('2026-05-01 09:00:00');

    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::FULL_PAYMENT,
        'grand_total' => 1_500_000,
    ]);

    Payment::create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 500_000,
        'status' => PaymentStatus::PAID,
        'paid_at' => '2026-04-28 09:00:00',
        'payload' => [
            'payment_type' => 'down_payment',
            'payment_receiver_type' => 'vendor',
        ],
    ]);

    Payment::create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'midtrans',
        'payment_method' => 'snap',
        'amount' => 1_000_000,
        'status' => PaymentStatus::PAID,
        'paid_at' => '2026-05-01 10:00:00',
        'payload' => [
            'payment_type' => 'bank_transfer',
            'payment_receiver_type' => 'vendor',
            'order_id' => '2-overwritten',
            'transaction_id' => 'midtrans-overwritten-123',
            'transaction_status' => 'settlement',
        ],
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('data.data.0.full_payment_detail.method_label', 'Online payment')
        ->where('data.data.0.full_payment_detail.receiver_label', 'vendor')
        ->where('data.data.0.full_payment_detail.amount', 1000000)
        ->where('data.data.0.full_payment_detail.payment_date', '2026-05-01T10:00:00.000000Z')
        ->where('data.data.0.full_payment_detail.receipt.type', 'online')
        ->where('data.data.0.full_payment_detail.receipt.order_id', '2-overwritten')
        ->where('data.data.0.full_payment_detail.receipt.transaction_id', 'midtrans-overwritten-123'));
});

test('booking index repairs stale awaiting payment booking with paid down payment', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = createScheduledBooking($vendor, $tour, [
        'vendor_id' => $vendor->id,
        'status' => BookingStatus::AWAITING_PAYMENT,
        'grand_total' => 1_000_000,
        'reserved_expires_at' => now()->addMinutes(5),
    ]);

    Payment::create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'midtrans',
        'payment_method' => 'snap',
        'amount' => 250_000,
        'status' => PaymentStatus::PAID,
        'paid_at' => now()->subMinute(),
        'payload' => [
            'payment_type' => 'down_payment',
            'payment_receiver_type' => 'vendor',
        ],
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('data.data.0.status', BookingStatus::DOWN_PAYMENT->value)
        ->where('data.data.0.down_payment_detail.amount', 250000));

    expect($booking->fresh()->status)->toBe(BookingStatus::DOWN_PAYMENT)
        ->and($booking->fresh()->reserved_expires_at)->toBeNull();
});

test('booking index keeps waiting payment approval when paid down payment has pending balance proof', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
        'grand_total' => 1_000_000,
    ]);

    Payment::create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'midtrans',
        'payment_method' => 'snap',
        'amount' => 250_000,
        'status' => PaymentStatus::PAID,
        'paid_at' => now()->subDay(),
        'payload' => [
            'payment_type' => 'down_payment',
            'payment_receiver_type' => 'vendor',
        ],
    ]);
    Payment::create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 750_000,
        'status' => PaymentStatus::PENDING,
        'payload' => [
            'payment_type' => 'full_payment',
            'payment_receiver_type' => 'vendor',
        ],
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('data.data.0.status', BookingStatus::WAITING_PAYMENT_APPROVAL->value)
        ->where('data.data.0.down_payment_detail.amount', 250000));

    expect($booking->fresh()->status)->toBe(BookingStatus::WAITING_PAYMENT_APPROVAL);
});

test('booking index exposes input by audit payload with legacy fallback', function () {
    $this->travelTo('2026-05-01 09:00:00');

    $this->user->update(['name' => 'Udin Admin']);
    $vendor = Company::factory()->create([
        'type' => 'vendor',
        'name' => 'Vendor Company',
    ]);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $customer = User::factory()->create(['name' => 'Jane Customer']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $operatorRole = "company:{$vendor->id}:operator";
    Role::query()->create([
        'name' => $operatorRole,
        'display_name' => 'Operator',
        'description' => 'Operator',
    ]);

    createBookingWithSchedule(1, [
        'user_id' => $customer->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'contact_name' => 'Legacy Contact',
        'created_at' => '2026-04-30 08:00:00',
    ]);

    createBookingWithSchedule(1, [
        'user_id' => $customer->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'input_by_user_id' => $this->user->id,
        'input_by_company_id' => $vendor->id,
        'input_by_role' => $operatorRole,
        'created_at' => '2026-05-01 08:00:00',
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('data.data.0.input_by.user_name', 'Udin Admin')
        ->where('data.data.0.input_by.company_name', 'Vendor Company')
        ->where('data.data.0.input_by.role_label', 'Operator')
        ->where('data.data.0.input_by.created_at', '2026-05-01T08:00:00.000000Z')
        ->where('data.data.1.input_by.user_name', 'Jane Customer')
        ->where('data.data.1.input_by.company_name', null)
        ->where('data.data.1.input_by.role_label', 'Customer')
        ->where('data.data.1.input_by.created_at', '2026-04-30T08:00:00.000000Z'));
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
    $booking = createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'booking_number' => 'BKG-FOLLOW-001',
        'departure_date' => $departureDate,
        'status' => BookingStatus::DOWN_PAYMENT,
        'pax_adult' => 1,
        'pax_child' => 0,
        'pax_infant' => 0,
        'total_price' => 1_000_000,
        'tax_rate' => 0,
        'tax_amount' => 0,
        'platform_fee' => 0,
        'commission_amount' => 0,
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
        ->where('data.data.0.document_followup.label', 'Incomplete')
        ->where('data.data.0.document_followup.missing_count', 1)
        ->where('data.data.0.document_followup.deadline', '2026-05-04')
        ->where('data.data.0.document_followup.days_remaining', 3)
        ->where('data.data.0.document_followup.is_overdue', false)
        ->where('data.data.0.document_followup.action_label', 'Complete Documents')
        ->where('data.data.0.document_followup.action_url', "/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/edit?step=documents")
        ->loadDeferredProps('bookings-followup', fn ($page) => $page
            ->where('followupSummary.payment_overdue', 0)
            ->where('followupSummary.payment_due_soon', 1)
            ->where('followupSummary.payment_due_soon_amount', 600_000)
            ->where('followupSummary.documents_incomplete', 1)
            ->where('followupSummary.documents_due_soon', 1)));
});

test('booking follow up summary ignores status filters and includes payment totals', function () {
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
    $dueSoonBooking = createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'departure_date' => '2026-05-16',
        'status' => BookingStatus::DOWN_PAYMENT,
        'grand_total' => 1_000_000,
    ]);
    Payment::create([
        'owner_type' => User::class,
        'owner_id' => $dueSoonBooking->user_id,
        'payable_type' => Booking::class,
        'payable_id' => $dueSoonBooking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 400_000,
        'status' => PaymentStatus::PAID,
    ]);

    createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'departure_date' => '2026-05-08',
        'status' => BookingStatus::AWAITING_PAYMENT,
        'grand_total' => 800_000,
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings?status=full%20payment");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('data.total', 0)
        ->loadDeferredProps('bookings-followup', fn ($page) => $page
            ->where('followupSummary.payment_overdue', 1)
            ->where('followupSummary.payment_overdue_amount', 800_000)
            ->where('followupSummary.payment_due_soon', 1)
            ->where('followupSummary.payment_due_soon_amount', 600_000)));
});

test('booking index filters rows by follow up card query', function () {
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
    createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'booking_number' => 'BKG-FOLLOW-OVERDUE',
        'departure_date' => '2026-05-08',
        'status' => BookingStatus::AWAITING_PAYMENT,
        'grand_total' => 800_000,
    ]);
    createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'booking_number' => 'BKG-FOLLOW-DUE-SOON',
        'departure_date' => '2026-05-16',
        'status' => BookingStatus::AWAITING_PAYMENT,
        'grand_total' => 600_000,
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings?followup=payment_overdue");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('data.total', 1)
        ->where('data.data.0.booking_number', 'BKG-FOLLOW-OVERDUE')
        ->where('data.data.0.payment_followup.state', 'overdue'));
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
    $booking = createBookingWithSchedule(1, [
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

test('booking index exposes complete payment action for payment in progress waiting approval holds', function () {
    $this->travelTo('2026-05-01 09:00:00');

    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $departureDate = '2026-05-16';
    $booking = createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'booking_number' => 'BKG-WA-PAYMENT',
        'departure_date' => $departureDate,
        'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
        'reserved_type' => 'payment_in_progress',
        'reserved_expires_at' => null,
        'grand_total' => 1_000_000,
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('data.data.0.payment_followup.state', 'due')
        ->where('data.data.0.payment_followup.label', 'Payment Due')
        ->where('data.data.0.payment_followup.action_label', 'Complete Payment')
        ->where('data.data.0.payment_followup.action_url', "/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}?date={$departureDate}&booking_number={$booking->booking_number}&step=payment"));
});

test('booking index exposes proforma eligibility for down payment and payment process only', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $downPaymentBooking = createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'booking_number' => 'PRO-DP',
        'status' => BookingStatus::DOWN_PAYMENT,
    ]);
    $waitingApprovalBooking = createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'booking_number' => 'PRO-WA-PAY',
        'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
        'reserved_type' => 'payment_in_progress',
    ]);
    $reservedBooking = createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'booking_number' => 'PRO-BR',
        'status' => BookingStatus::BOOKING_RESERVED,
    ]);

    $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings?booking_number=PRO-DP")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->missing('data.data.0.proforma_invoice_available'));

    $this->actingAs($this->user)
        ->getJson("/companies/{$vendor->username}/dashboard/bookings/{$downPaymentBooking->id}/row-actions")
        ->assertOk()
        ->assertJsonPath('proforma_invoice_available', true);

    $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings?booking_number=PRO-WA-PAY")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->missing('data.data.0.proforma_invoice_available'));

    $this->actingAs($this->user)
        ->getJson("/companies/{$vendor->username}/dashboard/bookings/{$waitingApprovalBooking->id}/row-actions")
        ->assertOk()
        ->assertJsonPath('proforma_invoice_available', true);

    $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings?booking_number=PRO-BR")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->missing('data.data.0.proforma_invoice_available'));

    $this->actingAs($this->user)
        ->getJson("/companies/{$vendor->username}/dashboard/bookings/{$reservedBooking->id}/row-actions")
        ->assertOk()
        ->assertJsonPath('proforma_invoice_available', false);
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
        $booking = createBookingWithSchedule(1, [
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
        ->loadDeferredProps('bookings-followup', fn ($page) => $page
            ->where('followupSummary.payment_overdue', 0)
            ->where('followupSummary.payment_due_soon', 0)
            ->where('followupSummary.documents_incomplete', 0)
            ->where('followupSummary.documents_due_soon', 0)));
});

test('booking index derives commission amount', function () {
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

    createBookingWithSchedule(1, [
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
        ->where('data.data.0.commission_amount', '300000.00'));
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

    $booking = createBookingWithSchedule(1, [
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
    $booking = createBookingWithSchedule(1, [
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
            'payment_date' => '2026-05-01',
            'sender_bank' => 'BCA',
            'sender_account' => '1234567890',
            'proof_path' => 'payment-proofs/proof.jpg',
        ],
    ]);

    createBookingWithSchedule(1, [
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
        ->missing('data.data.0.manual_payment'));

    $this->actingAs($this->user)
        ->getJson("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/row-actions")
        ->assertOk()
        ->assertJsonPath('manual_payment.id', $payment->id)
        ->assertJsonPath('manual_payment.sender_bank_name', 'BCA')
        ->assertJsonPath('manual_payment.sender_account_number', '1234567890')
        ->assertJsonPath('manual_payment.transfer_amount', 500_000)
        ->assertJsonPath('manual_payment.payment_date', '2026-05-01')
        ->assertJsonPath('manual_payment.proof_path', 'payment-proofs/proof.jpg');
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
    $booking = createBookingWithSchedule(1, [
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
        ->missing('data.data.0.can_review_manual_payment'));

    $this->actingAs($vendorUser)
        ->getJson("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/row-actions")
        ->assertOk()
        ->assertJsonPath('can_review_manual_payment', false);

    $agentResponse = $this->actingAs($agentUser)
        ->get("/companies/{$agent->username}/dashboard/bookings?status=waiting%20payment%20approval");

    $agentResponse->assertOk();
    $agentResponse->assertInertia(fn ($page) => $page
        ->has('data.data', 1)
        ->missing('data.data.0.can_review_manual_payment'));

    $this->actingAs($agentUser)
        ->getJson("/companies/{$agent->username}/dashboard/bookings/{$booking->id}/row-actions")
        ->assertOk()
        ->assertJsonPath('can_review_manual_payment', true);
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
    $booking = createBookingWithSchedule(1, [
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

test('agent index exposes customer online receipt and pay vendor workflow action', function () {
    $agentUser = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $agent = Company::factory()->create([
        'username' => 'onlinepayvendoragent',
        'type' => 'agent',
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
    $booking = createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
        'payment_mode' => 'online',
        'grand_total' => 1_000_000,
    ]);
    $customerPayment = Payment::create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'midtrans',
        'payment_method' => 'snap',
        'amount' => 500_000,
        'status' => PaymentStatus::PAID,
        'paid_at' => now()->subMinute(),
        'payload' => [
            'booking_payment_type' => 'down_payment',
            'payment_type' => 'down_payment',
            'payment_flow_stage' => 'customer_to_agent',
            'payment_receiver_type' => 'agent',
            'payment_receiver_company_id' => $agent->id,
            'partnership_payment_mode' => 'agent',
            'agent_review_status' => 'approved',
            'vendor_review_status' => null,
            'counts_toward_booking_total' => false,
            'order_id' => 'customer-agent-online-order',
            'snap_token' => 'customer-agent-online-token',
            'midtrans' => [
                'order_id' => 'customer-agent-online-order',
                'payment_type' => 'bank_transfer',
                'transaction_status' => 'settlement',
            ],
        ],
    ]);

    $response = $this->actingAs($agentUser)
        ->get("/companies/{$agent->username}/dashboard/bookings");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->missing('data.data.0.payment_workflow')
        ->where('data.data.0.payment_followup.action_label', 'Pay Vendor')
        ->where('data.data.0.down_payment_detail', null));

    $this->actingAs($agentUser)
        ->getJson("/companies/{$agent->username}/dashboard/bookings/{$booking->id}/row-actions")
        ->assertOk()
        ->assertJsonPath('payment_workflow.mode', 'agent_collection')
        ->assertJsonPath('payment_workflow.stage', 'agent_vendor_payment_due')
        ->assertJsonPath('payment_workflow.customer_payment.id', $customerPayment->id)
        ->assertJsonPath('payment_workflow.customer_payment.receipt.type', 'online')
        ->assertJsonPath('payment_workflow.customer_payment.receipt.order_id', 'customer-agent-online-order')
        ->assertJsonPath('payment_workflow.can_pay_vendor', true)
        ->assertJsonPath('manual_payment', null);
});

test('cancelled agent collection booking does not expose pay vendor workflow action', function () {
    $agentUser = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $agent = Company::factory()->create([
        'username' => 'cancelledpayvendoragent',
        'type' => 'agent',
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
    $booking = createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::CANCELLED,
        'payment_mode' => 'online',
        'grand_total' => 1_000_000,
    ]);
    $customerPayment = Payment::create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'midtrans',
        'payment_method' => 'snap',
        'amount' => 500_000,
        'status' => PaymentStatus::PAID,
        'paid_at' => now()->subMinute(),
        'payload' => [
            'booking_payment_type' => 'down_payment',
            'payment_type' => 'down_payment',
            'payment_flow_stage' => 'customer_to_agent',
            'payment_receiver_type' => 'agent',
            'payment_receiver_company_id' => $agent->id,
            'partnership_payment_mode' => 'agent',
            'agent_review_status' => 'approved',
            'vendor_review_status' => null,
            'counts_toward_booking_total' => false,
        ],
    ]);
    Payment::create([
        'owner_type' => User::class,
        'owner_id' => $agentUser->id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'midtrans',
        'payment_method' => 'snap',
        'amount' => 500_000,
        'status' => PaymentStatus::CANCELLED,
        'payload' => [
            'booking_payment_type' => 'down_payment',
            'payment_type' => 'down_payment',
            'payment_flow_stage' => 'agent_to_vendor',
            'linked_customer_payment_id' => $customerPayment->id,
            'payment_receiver_type' => 'vendor',
            'payment_receiver_company_id' => $vendor->id,
            'partnership_payment_mode' => 'agent',
            'vendor_review_status' => 'pending',
            'counts_toward_booking_total' => false,
        ],
    ]);

    $response = $this->actingAs($agentUser)
        ->get("/companies/{$agent->username}/dashboard/bookings");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->missing('data.data.0.payment_workflow')
        ->where('data.data.0.payment_followup.action_label', null));

    $this->actingAs($agentUser)
        ->getJson("/companies/{$agent->username}/dashboard/bookings/{$booking->id}/row-actions")
        ->assertOk()
        ->assertJsonPath('payment_workflow.mode', 'agent_collection')
        ->assertJsonPath('payment_workflow.can_pay_vendor', false)
        ->assertJsonPath('payment_workflow.can_review_customer_payment', false)
        ->assertJsonPath('payment_workflow.can_review_agent_vendor_payment', false)
        ->assertJsonPath('manual_payment', null);
});

test('pending agent vendor online attempt does not replace pay vendor controls', function () {
    $agentUser = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $agent = Company::factory()->create([
        'username' => 'pendingagentvendorattempt',
        'type' => 'agent',
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
    $booking = createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
        'payment_mode' => 'online',
        'grand_total' => 1_000_000,
    ]);
    $customerPayment = Payment::create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'midtrans',
        'payment_method' => 'snap',
        'amount' => 500_000,
        'status' => PaymentStatus::PAID,
        'paid_at' => now()->subMinute(),
        'payload' => [
            'booking_payment_type' => 'down_payment',
            'payment_type' => 'down_payment',
            'payment_flow_stage' => 'customer_to_agent',
            'payment_receiver_type' => 'agent',
            'payment_receiver_company_id' => $agent->id,
            'partnership_payment_mode' => 'agent',
            'agent_review_status' => 'approved',
            'vendor_review_status' => null,
            'counts_toward_booking_total' => false,
        ],
    ]);
    Payment::create([
        'owner_type' => User::class,
        'owner_id' => $agentUser->id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'midtrans',
        'payment_method' => 'snap',
        'amount' => 500_000,
        'status' => PaymentStatus::PENDING,
        'payload' => [
            'booking_payment_type' => 'down_payment',
            'payment_type' => 'down_payment',
            'payment_flow_stage' => 'agent_to_vendor',
            'linked_customer_payment_id' => $customerPayment->id,
            'payment_receiver_type' => 'vendor',
            'payment_receiver_company_id' => $vendor->id,
            'partnership_payment_mode' => 'agent',
            'vendor_review_status' => 'pending',
            'counts_toward_booking_total' => false,
            'order_id' => 'agent-vendor-pending-order',
            'snap_token' => 'agent-vendor-pending-token',
            'snap_token_expires_at' => now()->addHour()->toISOString(),
        ],
    ]);

    $response = $this->actingAs($agentUser)
        ->get("/companies/{$agent->username}/dashboard/bookings");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->missing('data.data.0.payment_workflow')
        ->where('data.data.0.payment_followup.action_label', 'Pay Vendor'));

    $this->actingAs($agentUser)
        ->getJson("/companies/{$agent->username}/dashboard/bookings/{$booking->id}/row-actions")
        ->assertOk()
        ->assertJsonPath('payment_workflow.mode', 'agent_collection')
        ->assertJsonPath('payment_workflow.stage', 'agent_vendor_payment_due')
        ->assertJsonPath('payment_workflow.customer_payment.id', $customerPayment->id)
        ->assertJsonPath('payment_workflow.agent_vendor_payment', null)
        ->assertJsonPath('payment_workflow.can_pay_vendor', true)
        ->assertJsonPath('manual_payment', null);
});

test('agent submits gross payment to vendor after customer payment is verified', function () {
    Storage::fake('public');

    $agentUser = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $vendor->companySetting()->updateOrCreate([], [
        'minimum_down_payment' => 30,
    ]);
    $agent = Company::factory()->create([
        'username' => 'grosspayagent',
        'type' => 'agent',
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
    $booking = createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
        'payment_mode' => 'manual',
        'grand_total' => 1_000_000,
    ]);
    $customerPayment = Payment::create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 500_000,
        'status' => PaymentStatus::PAID,
        'paid_at' => now()->subMinute(),
        'payload' => [
            'booking_payment_type' => 'down_payment',
            'payment_type' => 'down_payment',
            'payment_flow_stage' => 'customer_to_agent',
            'payment_receiver_type' => 'agent',
            'payment_receiver_company_id' => $agent->id,
            'partnership_payment_mode' => 'agent',
            'agent_review_status' => 'approved',
            'counts_toward_booking_total' => false,
        ],
    ]);

    $this->actingAs($agentUser)
        ->post("/companies/{$agent->username}/dashboard/bookings/{$booking->id}/manual-payment", [
            'sender_bank_name' => 'BCA',
            'sender_account_number' => '1234567890',
            'transfer_amount' => 500_000,
            'payment_type' => 'down_payment',
            'payment_date' => '2026-05-01',
            'proof' => UploadedFile::fake()->image('agent-vendor-proof.jpg'),
        ])
        ->assertRedirect();

    $agentVendorPayment = $booking->fresh()->payments
        ->first(fn (Payment $payment): bool => data_get($payment->payload, 'payment_flow_stage') === 'agent_to_vendor');

    expect($agentVendorPayment->status)->toBe(PaymentStatus::PENDING)
        ->and((float) $agentVendorPayment->amount)->toBe(500000.0)
        ->and(data_get($agentVendorPayment->payload, 'payment_flow_stage'))->toBe('agent_to_vendor')
        ->and(data_get($agentVendorPayment->payload, 'linked_customer_payment_id'))->toBe($customerPayment->id)
        ->and(data_get($agentVendorPayment->payload, 'payment_receiver_type'))->toBe('vendor')
        ->and(data_get($agentVendorPayment->payload, 'payment_receiver_company_id'))->toBe($vendor->id)
        ->and(data_get($agentVendorPayment->payload, 'counts_toward_booking_total'))->toBeFalse()
        ->and(data_get($agentVendorPayment->payload, 'vendor_review_status'))->toBe('pending')
        ->and($booking->fresh()->status)->toBe(BookingStatus::WAITING_PAYMENT_APPROVAL);
});

test('vendor review sees both staged receipts and approval finalizes booking', function () {
    $vendorUser = User::factory()->create();
    $vendor = Company::factory()->create([
        'username' => 'stagedvendor',
        'type' => 'vendor',
    ]);
    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $vendorUser->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);
    $agent = Company::factory()->create(['type' => 'agent']);
    VendorAgentPartner::create([
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'status' => VendorAgentPartnerStatus::ACTIVE,
        'accepted_at' => now(),
        'payment_mode' => 'agent',
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = createScheduledBooking($vendor, $tour, [
        'agent_id' => $agent->id,
        'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
        'payment_mode' => 'manual',
        'grand_total' => 1_000_000,
    ]);
    $customerPayment = Payment::create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 500_000,
        'status' => PaymentStatus::PAID,
        'paid_at' => now()->subHour(),
        'payload' => [
            'booking_payment_type' => 'down_payment',
            'payment_type' => 'down_payment',
            'payment_flow_stage' => 'customer_to_agent',
            'payment_receiver_type' => 'agent',
            'payment_receiver_company_id' => $agent->id,
            'partnership_payment_mode' => 'agent',
            'agent_review_status' => 'approved',
            'counts_toward_booking_total' => false,
            'proof_path' => 'payment-proofs/customer.jpg',
        ],
    ]);
    $agentVendorPayment = Payment::create([
        'owner_type' => User::class,
        'owner_id' => $vendorUser->id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 500_000,
        'status' => PaymentStatus::PENDING,
        'payload' => [
            'booking_payment_type' => 'down_payment',
            'payment_type' => 'down_payment',
            'payment_flow_stage' => 'agent_to_vendor',
            'linked_customer_payment_id' => $customerPayment->id,
            'payment_receiver_type' => 'vendor',
            'payment_receiver_company_id' => $vendor->id,
            'partnership_payment_mode' => 'agent',
            'vendor_review_status' => 'pending',
            'counts_toward_booking_total' => false,
            'proof_path' => 'payment-proofs/agent.jpg',
        ],
    ]);

    $this->actingAs($vendorUser)
        ->get("/companies/{$vendor->username}/dashboard/bookings")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->missing('data.data.0.payment_workflow')
            ->where('data.data.0.down_payment_detail', null));

    $this->actingAs($vendorUser)
        ->getJson("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/row-actions")
        ->assertOk()
        ->assertJsonPath('payment_workflow.mode', 'agent_collection')
        ->assertJsonPath('payment_workflow.stage', 'vendor_review')
        ->assertJsonPath('payment_workflow.customer_payment.id', $customerPayment->id)
        ->assertJsonPath('payment_workflow.agent_vendor_payment.id', $agentVendorPayment->id)
        ->assertJsonPath('payment_workflow.customer_payment.receipt.type', 'manual')
        ->assertJsonPath('payment_workflow.agent_vendor_payment.receipt.type', 'manual')
        ->assertJsonPath('payment_workflow.can_review_agent_vendor_payment', true)
        ->assertJsonPath('manual_payment.id', $agentVendorPayment->id)
        ->assertJsonPath('manual_payment.customer_payment.receipt.type', 'manual')
        ->assertJsonPath('manual_payment.agent_vendor_payment.receipt.type', 'manual');

    $this->actingAs($vendorUser)
        ->post("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/payments/{$agentVendorPayment->id}/approve")
        ->assertRedirect();

    $customerPayment->refresh();
    $agentVendorPayment->refresh();

    expect($booking->fresh()->status)->toBe(BookingStatus::DOWN_PAYMENT)
        ->and(data_get($customerPayment->payload, 'vendor_review_status'))->toBe('approved')
        ->and(data_get($customerPayment->payload, 'counts_toward_booking_total'))->toBeTrue()
        ->and(data_get($agentVendorPayment->payload, 'vendor_review_status'))->toBe('approved')
        ->and($agentVendorPayment->status)->toBe(PaymentStatus::PAID);

    $this->actingAs($vendorUser)
        ->get("/companies/{$vendor->username}/dashboard/bookings")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('data.data.0.status', BookingStatus::DOWN_PAYMENT->value)
            ->where('data.data.0.down_payment_detail.amount', 500000)
            ->where('data.data.0.down_payment_detail.receipt_group.0.title', 'Customer to Agent')
            ->where('data.data.0.down_payment_detail.receipt_group.0.detail.receipt.type', 'manual')
            ->where('data.data.0.down_payment_detail.receipt_group.1.title', 'Agent to Vendor')
            ->where('data.data.0.down_payment_detail.receipt_group.1.detail.receipt.type', 'manual')
            ->where('data.data.0.full_payment_detail', null));
});

test('vendor decline keeps agent collection booking waiting approval for resubmission', function () {
    $vendorUser = User::factory()->create();
    $vendor = Company::factory()->create([
        'username' => 'declinestagedvendor',
        'type' => 'vendor',
    ]);
    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $vendorUser->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);
    $agent = Company::factory()->create(['type' => 'agent']);
    VendorAgentPartner::create([
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'status' => VendorAgentPartnerStatus::ACTIVE,
        'accepted_at' => now(),
        'payment_mode' => 'agent',
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
        'payment_mode' => 'manual',
        'grand_total' => 1_000_000,
    ]);
    $customerPayment = Payment::create([
        'owner_type' => User::class,
        'owner_id' => $booking->user_id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 500_000,
        'status' => PaymentStatus::PAID,
        'paid_at' => now()->subHour(),
        'payload' => [
            'booking_payment_type' => 'down_payment',
            'payment_type' => 'down_payment',
            'payment_flow_stage' => 'customer_to_agent',
            'payment_receiver_type' => 'agent',
            'payment_receiver_company_id' => $agent->id,
            'partnership_payment_mode' => 'agent',
            'agent_review_status' => 'approved',
            'counts_toward_booking_total' => false,
        ],
    ]);
    $agentVendorPayment = Payment::create([
        'owner_type' => User::class,
        'owner_id' => $vendorUser->id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 500_000,
        'status' => PaymentStatus::PENDING,
        'payload' => [
            'booking_payment_type' => 'down_payment',
            'payment_type' => 'down_payment',
            'payment_flow_stage' => 'agent_to_vendor',
            'linked_customer_payment_id' => $customerPayment->id,
            'payment_receiver_type' => 'vendor',
            'payment_receiver_company_id' => $vendor->id,
            'partnership_payment_mode' => 'agent',
            'vendor_review_status' => 'pending',
            'counts_toward_booking_total' => false,
        ],
    ]);

    $this->actingAs($vendorUser)
        ->post("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/payments/{$agentVendorPayment->id}/decline")
        ->assertRedirect();

    $customerPayment->refresh();
    $agentVendorPayment->refresh();

    expect($booking->fresh()->status)->toBe(BookingStatus::WAITING_PAYMENT_APPROVAL)
        ->and(data_get($customerPayment->payload, 'counts_toward_booking_total'))->toBeFalse()
        ->and(data_get($agentVendorPayment->payload, 'vendor_review_status'))->toBe('declined')
        ->and($agentVendorPayment->status)->toBe(PaymentStatus::FAILED);
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
    $booking = createBookingWithSchedule(1, [
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

    $this->assertDatabaseHas('booking_action_requests', [
        'booking_id' => $booking->id,
        'requester_company_id' => $vendor->id,
        'requester_user_id' => $this->user->id,
        'target_action' => 'cancel',
        'status' => 'approved',
        'reason' => 'Customer requested cancellation',
        'reviewer_company_id' => $vendor->id,
        'reviewer_user_id' => $this->user->id,
    ]);
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
    $fullPaymentBooking = createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::FULL_PAYMENT,
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->missing('data.data.0.can_cancel')
        ->missing('data.data.0.can_refund'));

    $this->actingAs($this->user)
        ->getJson("/companies/{$vendor->username}/dashboard/bookings/{$fullPaymentBooking->id}/row-actions")
        ->assertOk()
        ->assertJsonPath('can_cancel', true)
        ->assertJsonPath('can_refund', true);
});

test('down payment booking exposes cancel and refund actions in dashboard index', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $downPaymentBooking = createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::DOWN_PAYMENT,
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->missing('data.data.0.can_cancel')
        ->missing('data.data.0.can_refund'));

    $this->actingAs($this->user)
        ->getJson("/companies/{$vendor->username}/dashboard/bookings/{$downPaymentBooking->id}/row-actions")
        ->assertOk()
        ->assertJsonPath('can_cancel', true)
        ->assertJsonPath('can_refund', true);
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
    $booking = createBookingWithSchedule(1, [
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

    $this->assertDatabaseHas('booking_action_requests', [
        'booking_id' => $booking->id,
        'requester_company_id' => $vendor->id,
        'requester_user_id' => $this->user->id,
        'target_action' => 'cancel',
        'status' => 'approved',
        'reason' => 'Customer requested cancellation after full payment',
        'reviewer_company_id' => $vendor->id,
        'reviewer_user_id' => $this->user->id,
    ]);
});

test('vendor can directly cancel a down payment booking and release availability', function () {
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
    $booking = createBookingWithSchedule(1, [
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
        ->post("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/cancel", [
            'reason' => 'Customer requested cancellation after down payment',
        ]);

    $response->assertRedirect();

    expect($booking->fresh()->status)->toBe(BookingStatus::CANCELLED)
        ->and($payment->fresh()->status)->toBe(PaymentStatus::PAID)
        ->and((int) $availability->fresh()->DP)->toBe(0)
        ->and((int) $availability->fresh()->CA)->toBe(2)
        ->and((float) $availability->fresh()->available)->toBe(10.0);

    $this->assertDatabaseHas('booking_action_requests', [
        'booking_id' => $booking->id,
        'requester_company_id' => $vendor->id,
        'requester_user_id' => $this->user->id,
        'target_action' => 'cancel',
        'status' => 'approved',
        'reason' => 'Customer requested cancellation after down payment',
        'reviewer_company_id' => $vendor->id,
        'reviewer_user_id' => $this->user->id,
    ]);
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
    $booking = createBookingWithSchedule(1, [
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

    $this->assertDatabaseHas('booking_action_requests', [
        'booking_id' => $booking->id,
        'requester_company_id' => $vendor->id,
        'requester_user_id' => $this->user->id,
        'target_action' => 'refund',
        'status' => 'approved',
        'reason' => 'Refund approved by vendor',
        'reviewer_company_id' => $vendor->id,
        'reviewer_user_id' => $this->user->id,
    ]);
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
    $booking = createBookingWithSchedule(1, [
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

test('agent down payment cancel creates a pending vendor approval request without mutating booking', function () {
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
    $booking = createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::DOWN_PAYMENT,
    ]);

    $response = $this->actingAs($agentUser)
        ->post("/companies/{$agent->username}/dashboard/bookings/{$booking->id}/cancel", [
            'reason' => 'Agent requested down payment cancellation',
        ]);

    $response->assertRedirect();

    expect($booking->fresh()->status)->toBe(BookingStatus::DOWN_PAYMENT);
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
    $booking = createBookingWithSchedule(1, [
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

test('vendor can reorder an eligible expired booking with the same booking number', function () {
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
        'EX' => 2,
    ]);
    $booking = createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'booking_number' => 'BKG-REORDER-001',
        'departure_date' => $departureDate,
        'status' => BookingStatus::EXPIRED,
        'reserved_type' => 'system',
        'reserved_expires_at' => now()->subMinute(),
        'pax_adult' => 2,
        'pax_child' => 0,
        'pax_infant' => 0,
    ]);

    $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->missing('data.data.0.can_reorder'));

    $this->actingAs($this->user)
        ->getJson("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/row-actions")
        ->assertOk()
        ->assertJsonPath('can_reorder', true);

    $response = $this->actingAs($this->user)
        ->post("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/reorder");

    $response->assertRedirect("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}?date={$departureDate}&booking_number=BKG-REORDER-001");

    expect($booking->fresh()->status)->toBe(BookingStatus::AWAITING_PAYMENT)
        ->and($booking->fresh()->booking_number)->toBe('BKG-REORDER-001')
        ->and($booking->fresh()->reserved_expires_at)->toBeNull()
        ->and((int) $availability->fresh()->EX)->toBe(0)
        ->and((int) $availability->fresh()->WP)->toBe(2);
});

test('agent can reorder an eligible expired agent booking with the same booking number', function () {
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
    $departureDate = now()->addMonth()->toDateString();
    TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $vendor->id,
        'departure_date' => $departureDate,
        'return_date' => now()->addMonth()->addDays(5)->toDateString(),
        'is_active' => true,
    ]);
    $booking = createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $tour->id,
        'booking_number' => 'BKG-AGENT-REORDER',
        'departure_date' => $departureDate,
        'status' => BookingStatus::EXPIRED,
    ]);

    $response = $this->actingAs($agentUser)
        ->post("/companies/{$agent->username}/dashboard/bookings/{$booking->id}/reorder");

    $response->assertRedirect("/companies/{$agent->username}/dashboard/bookings/create/{$tour->id}?date={$departureDate}&booking_number=BKG-AGENT-REORDER");

    expect($booking->fresh()->status)->toBe(BookingStatus::AWAITING_PAYMENT)
        ->and($booking->fresh()->booking_number)->toBe('BKG-AGENT-REORDER');
});

test('dashboard reorder rejects non expired bookings', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'departure_date' => now()->addMonth()->toDateString(),
        'status' => BookingStatus::DOWN_PAYMENT,
    ]);

    $this->actingAs($this->user)
        ->post("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/reorder")
        ->assertStatus(422);
});

test('dashboard cancel returns validation error instead of exception overlay for invalid status', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::CANCELLED,
    ]);

    $response = $this->actingAs($this->user)
        ->from("/companies/{$vendor->username}/dashboard/bookings")
        ->post("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/cancel", [
            'reason' => 'Duplicate click after cancellation',
        ]);

    $response->assertRedirect("/companies/{$vendor->username}/dashboard/bookings");
    $response->assertSessionHasErrors('booking_action');
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

    $refundTour = Tour::factory()->create([
        'company_id' => $vendor->id,
        'name' => 'Refund Island Escape',
        'code' => 'RFD-SEA',
    ]);
    $cancelTour = Tour::factory()->create([
        'company_id' => $vendor->id,
        'name' => 'Cancel Mountain Trail',
        'code' => 'CXL-MTN',
    ]);
    $bookingToApprove = createBookingWithSchedule(1, [
        'booking_number' => 'BKG-REFUND-001',
        'contact_name' => 'Refund Customer',
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $refundTour->id,
        'departure_date' => '2026-12-24',
        'status' => BookingStatus::DOWN_PAYMENT,
    ]);
    $bookingToReject = createBookingWithSchedule(1, [
        'booking_number' => 'BKG-CANCEL-001',
        'contact_name' => 'Cancel Customer',
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $cancelTour->id,
        'departure_date' => '2026-11-15',
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
            'created_at' => now()->subMinute(),
            'updated_at' => now()->subMinute(),
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
        ->get("/companies/{$vendor->username}/dashboard/booking-correction");

    $indexResponse->assertOk();
    $indexResponse->assertInertia(fn ($page) => $page
        ->component('companies/dashboard/bookings/action-requests')
        ->where('activeAction', 'cancel')
        ->where('requests.total', 1)
        ->has('requests.data', 1)
        ->where('requests.data.0.target_action', 'cancel')
        ->where('canReviewRequests', true)
        ->where('actionRequiredCounts.cancellations', 1)
        ->where('actionRequiredCounts.refunds', 1));

    $refundIndexResponse = $this->actingAs($vendorUser)
        ->get("/companies/{$vendor->username}/dashboard/booking-correction?action=refund");

    $refundIndexResponse->assertOk();
    $refundIndexResponse->assertInertia(fn ($page) => $page
        ->component('companies/dashboard/bookings/action-requests')
        ->where('activeAction', 'refund')
        ->where('search', '')
        ->where('requests.total', 1)
        ->has('requests.data', 1)
        ->where('requests.data.0.target_action', 'refund')
        ->where('requests.data.0.reason', 'Refund requested'));

    $searchByTourResponse = $this->actingAs($vendorUser)
        ->get("/companies/{$vendor->username}/dashboard/booking-correction?search=Mountain");

    $searchByTourResponse->assertOk();
    $searchByTourResponse->assertInertia(fn ($page) => $page
        ->component('companies/dashboard/bookings/action-requests')
        ->where('activeAction', 'cancel')
        ->where('search', 'Mountain')
        ->where('requests.total', 1)
        ->where('requests.data.0.booking.booking_number', 'BKG-CANCEL-001'));

    $searchByDepartureResponse = $this->actingAs($vendorUser)
        ->get("/companies/{$vendor->username}/dashboard/booking-correction?action=refund&search=2026-12-24");

    $searchByDepartureResponse->assertOk();
    $searchByDepartureResponse->assertInertia(fn ($page) => $page
        ->component('companies/dashboard/bookings/action-requests')
        ->where('activeAction', 'refund')
        ->where('search', '2026-12-24')
        ->where('requests.total', 1)
        ->where('requests.data.0.booking.booking_number', 'BKG-REFUND-001'));

    $approveResponse = $this->actingAs($vendorUser)
        ->post("/companies/{$vendor->username}/dashboard/booking-correction/1001/approve");
    $rejectResponse = $this->actingAs($vendorUser)
        ->post("/companies/{$vendor->username}/dashboard/booking-correction/1002/reject");

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

    $historyResponse = $this->actingAs($vendorUser)
        ->get("/companies/{$vendor->username}/dashboard/booking-correction");

    $historyResponse->assertOk();
    $historyResponse->assertInertia(fn ($page) => $page
        ->component('companies/dashboard/bookings/action-requests')
        ->where('activeAction', 'cancel')
        ->where('requests.total', 1)
        ->has('requests.data', 1)
        ->where('actionRequiredCounts.cancellations', 0)
        ->where('actionRequiredCounts.refunds', 0)
        ->where('requests.data.0.status', 'rejected')
        ->where('requests.data.0.reviewer.user_name', $vendorUser->name)
        ->where('requests.data.0.reviewer.company_name', $vendor->name)
        ->where('requests.data.0.reviewer.action_label', 'Rejected by'));

    $refundHistoryResponse = $this->actingAs($vendorUser)
        ->get("/companies/{$vendor->username}/dashboard/booking-correction?action=refund");

    $refundHistoryResponse->assertOk();
    $refundHistoryResponse->assertInertia(fn ($page) => $page
        ->component('companies/dashboard/bookings/action-requests')
        ->where('activeAction', 'refund')
        ->where('requests.total', 1)
        ->has('requests.data', 1)
        ->where('requests.data.0.status', 'approved')
        ->where('requests.data.0.reviewer.user_name', $vendorUser->name)
        ->where('requests.data.0.reviewer.company_name', $vendor->name)
        ->where('requests.data.0.reviewer.action_label', 'Approved by'));
});

test('legacy booking request urls redirect to booking correction', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/booking-action-requests?action=refund&search=Mountain");

    $response->assertRedirect("/companies/{$vendor->username}/dashboard/booking-correction?action=refund&search=Mountain");

    $modificationResponse = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/booking-modification-requests?action=refund&search=Mountain");

    $modificationResponse->assertRedirect("/companies/{$vendor->username}/dashboard/booking-correction?action=refund&search=Mountain");
});

test('direct vendor booking actions use final action reviewer labels', function () {
    $vendorUser = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $vendorUser->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $cancelledBooking = createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::CANCELLED,
    ]);
    $refundedBooking = createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::REFUNDED,
    ]);

    DB::table('booking_action_requests')->insert([
        [
            'booking_id' => $cancelledBooking->id,
            'requester_company_id' => $vendor->id,
            'requester_user_id' => $vendorUser->id,
            'target_action' => 'cancel',
            'status' => 'approved',
            'reason' => 'Cancelled directly by vendor',
            'reviewer_company_id' => $vendor->id,
            'reviewer_user_id' => $vendorUser->id,
            'reviewed_at' => now(),
            'created_at' => now()->subMinute(),
            'updated_at' => now()->subMinute(),
        ],
        [
            'booking_id' => $refundedBooking->id,
            'requester_company_id' => $vendor->id,
            'requester_user_id' => $vendorUser->id,
            'target_action' => 'refund',
            'status' => 'approved',
            'reason' => 'Refunded directly by vendor',
            'reviewer_company_id' => $vendor->id,
            'reviewer_user_id' => $vendorUser->id,
            'reviewed_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ],
    ]);

    $cancelResponse = $this->actingAs($vendorUser)
        ->get("/companies/{$vendor->username}/dashboard/booking-correction");

    $cancelResponse->assertOk();
    $cancelResponse->assertInertia(fn ($page) => $page
        ->component('companies/dashboard/bookings/action-requests')
        ->where('activeAction', 'cancel')
        ->where('requests.data.0.reviewer.action_label', 'Cancelled by'));

    $refundResponse = $this->actingAs($vendorUser)
        ->get("/companies/{$vendor->username}/dashboard/booking-correction?action=refund");

    $refundResponse->assertOk();
    $refundResponse->assertInertia(fn ($page) => $page
        ->component('companies/dashboard/bookings/action-requests')
        ->where('activeAction', 'refund')
        ->where('requests.data.0.reviewer.action_label', 'Refunded by'));
});

test('agent can monitor their booking modification requests without review actions', function () {
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
    $booking = createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::DOWN_PAYMENT,
    ]);
    DB::table('booking_action_requests')->insert([
        'id' => 1003,
        'booking_id' => $booking->id,
        'requester_company_id' => $agent->id,
        'requester_user_id' => $agentUser->id,
        'target_action' => 'cancel',
        'status' => 'pending',
        'reason' => 'Customer asked agent to cancel',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $response = $this->actingAs($agentUser)
        ->get("/companies/{$agent->username}/dashboard/booking-correction");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('companies/dashboard/bookings/action-requests')
        ->where('activeAction', 'cancel')
        ->has('requests.data', 1)
        ->where('canReviewRequests', false)
        ->where('actionRequiredCounts.cancellations', 0)
        ->where('requests.data.0.status', 'pending')
        ->where('requests.data.0.requester_company.name', $agent->name));
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

    createBookingWithSchedule(1, [
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
        ->and((int) $availability->BRS)->toBe(3)
        ->and((int) $availability->DP)->toBe(0)
        ->and((float) $availability->available)->toBe(5.0);
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
    $booking = createBookingWithSchedule(1, [
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
    $booking = createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'departure_date' => $departureDate,
        'status' => BookingStatus::RESERVED,
        'pax_adult' => 1,
        'pax_child' => 0,
        'pax_infant' => 0,
        'total_price' => 1_000_000,
        'tax_rate' => 11,
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

test('vendor booking update rejects multiple dependent bed guests in one room', function () {
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
    TourSchedule::create([
        'company_id' => $vendor->id,
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'departure_date' => $departureDate,
        'return_date' => now()->addDays(25)->toDateString(),
        'is_active' => true,
    ]);

    $booking = createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'departure_date' => $departureDate,
        'status' => BookingStatus::RESERVED,
        'pax_adult' => 1,
        'pax_child' => 0,
        'pax_infant' => 0,
    ]);
    $passenger = BookingPassenger::factory()->create([
        'booking_id' => $booking->id,
        'first_name' => 'Old',
        'last_name' => 'Guest',
        'price_category' => 'Adult Twin',
        'price_amount' => 1_000_000,
        'room_type' => 'Twin',
    ]);

    $response = $this->actingAs($this->user)
        ->from("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/edit")
        ->put("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}", [
            'contact_name' => 'Invalid Room Customer',
            'contact_email' => 'invalid-room@example.test',
            'contact_phone' => '08123456789',
            'contact_notes' => null,
            'pax_adult' => 3,
            'pax_child' => 1,
            'pax_infant' => 0,
            'total_price' => 3_000_000,
            'tax_amount' => 330_000,
            'platform_fee' => 120_000,
            'commission_amount' => 0,
            'grand_total' => 3_450_000,
            'passengers' => [
                [
                    'id' => $passenger->id,
                    'title' => 'Mr',
                    'first_name' => 'Base',
                    'last_name' => 'One',
                    'dob' => '1990-01-01',
                    'pob' => 'Jakarta',
                    'price_category' => 'Adult Twin',
                    'price_amount' => 1_000_000,
                    'room_type' => 'Twin',
                    'room_number' => '1',
                ],
                [
                    'title' => 'Mr',
                    'first_name' => 'Base',
                    'last_name' => 'Two',
                    'dob' => '1991-01-01',
                    'pob' => 'Jakarta',
                    'price_category' => 'Adult Twin',
                    'price_amount' => 1_000_000,
                    'room_type' => 'Twin',
                    'room_number' => '2',
                ],
                [
                    'title' => 'Mr',
                    'first_name' => 'Extra',
                    'last_name' => 'Adult',
                    'dob' => '1992-01-01',
                    'pob' => 'Jakarta',
                    'price_category' => 'Adult Extra Bed',
                    'price_amount' => 500_000,
                    'room_type' => 'Adult Extra Bed',
                    'room_number' => '1',
                ],
                [
                    'title' => 'Master',
                    'first_name' => 'Child',
                    'last_name' => 'Withbed',
                    'dob' => '2016-01-01',
                    'pob' => 'Jakarta',
                    'price_category' => 'Child With Bed',
                    'price_amount' => 500_000,
                    'room_type' => 'Child With Extra Bed',
                    'room_number' => '1',
                ],
            ],
            'rooms' => [
                [
                    'room_type' => 'twin_extra_bed',
                    'room_label' => 'Twin Room 1',
                    'bed_layout' => [
                        ['bedType' => 'twin_extra_bed', 'guestId' => 'adult-0'],
                        ['bedType' => 'twin_extra_bed', 'guestId' => 'adult-2'],
                        ['bedType' => 'twin_extra_bed', 'guestId' => 'child-0'],
                    ],
                ],
                [
                    'room_type' => 'twin',
                    'room_label' => 'Twin Room 2',
                    'bed_layout' => [
                        ['bedType' => 'twin', 'guestId' => 'adult-1'],
                    ],
                ],
            ],
            'addons' => [],
        ]);

    $response->assertSessionHasErrors('passengers');
    expect($booking->fresh()->pax_adult)->toBe(1);
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

    $booking = createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'status' => BookingStatus::AWAITING_PAYMENT,
        'pax_adult' => 1,
        'pax_child' => 0,
        'pax_infant' => 0,
        'total_price' => 1_000_000,
        'tax_rate' => 0,
        'tax_amount' => 0,
        'platform_fee' => 0,
        'commission_amount' => 0,
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
    Payment::create([
        'owner_type' => User::class,
        'owner_id' => $this->user->id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 250_000,
        'status' => 'paid',
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
        ->where('paidAmount', 250000)
        ->where('remainingBalance', 750000)
        ->where('vendorBankInfo.bankName', 'Mandiri')
        ->where('bookingSeatLimit', 4));
});

test('booking edit resolves agent commission when booking snapshot is zero', function () {
    $agentUser = User::factory()->create();
    $vendor = Company::factory()->create([
        'username' => 'editcommissionvendor',
        'type' => 'vendor',
    ]);
    $agent = Company::factory()->create([
        'username' => 'editcommissionagent',
        'type' => 'agent',
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
    $departureDate = now()->addMonth()->toDateString();
    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $vendor->id,
        'departure_date' => $departureDate,
        'return_date' => now()->addMonth()->addDays(5)->toDateString(),
        'is_active' => true,
    ]);
    $category = PriceCategory::create([
        'company_id' => $vendor->id,
        'name' => 'Adult Twin',
        'room_type' => 'twin',
    ]);
    TourPrice::create([
        'company_id' => $vendor->id,
        'tour_code' => $tour->code,
        'schedule_id' => $schedule->id,
        'price_category_id' => $category->id,
        'currency' => 'IDR',
        'price' => 10_000_000,
        'commission_rate' => 10,
        'commission' => 0,
    ]);

    $booking = createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $tour->id,
        'departure_date' => $departureDate,
        'status' => BookingStatus::AWAITING_PAYMENT,
        'pax_adult' => 1,
        'pax_child' => 0,
        'pax_infant' => 0,
        'commission_amount' => 0,
        'grand_total' => 10_135_000,
    ]);
    BookingPassenger::create([
        'booking_id' => $booking->id,
        'title' => 'Mr',
        'first_name' => 'Commission',
        'last_name' => 'Guest',
        'price_category' => 'Adult Twin',
        'price_amount' => 9_000_000,
    ]);

    $response = $this->actingAs($agentUser)
        ->get("/companies/{$agent->username}/dashboard/bookings/{$booking->id}/edit");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('companies/dashboard/bookings/edit')
        ->where('booking.commission_amount', '900000.00'));
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
    $booking = createBookingWithSchedule(1, [
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
    $booking = createBookingWithSchedule(1, [
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

test('waiting approval booking allows dashboard document-only updates', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
        'departure_date' => now()->addMonth()->toDateString(),
        'pax_adult' => 1,
        'pax_child' => 0,
        'pax_infant' => 0,
    ]);
    $passenger = BookingPassenger::create([
        'booking_id' => $booking->id,
        'title' => 'Ms',
        'first_name' => 'Waiting',
        'last_name' => 'Docs',
        'dob' => now()->subYears(28)->toDateString(),
        'pob' => 'Bandung',
        'price_category' => 'Adult Twin',
        'price_amount' => 1_000_000,
    ]);

    $this->actingAs($this->user)
        ->post("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/travel-documents", [
            'passengers' => [[
                'id' => $passenger->id,
                'passport_number' => 'WA123456',
                'passport_issue_date' => now()->subYear()->toDateString(),
                'passport_expiry_date' => now()->addYears(4)->toDateString(),
                'passport_file_path' => 'travel-documents/passports/wa.pdf',
                'visa_number' => 'WA-VISA',
                'visa_file_path' => 'travel-documents/visas/wa.pdf',
            ]],
        ])
        ->assertRedirect();

    $passenger->refresh();
    expect($passenger->passport_number)->toBe('WA123456')
        ->and($passenger->visa_number)->toBe('WA-VISA');
});

test('full payment booking with complete documents still allows dashboard document edits', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = createBookingWithSchedule(1, [
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
        ->where('editMode', 'documents')
        ->where('canEditDocuments', true));

    $passenger = $booking->passengers()->firstOrFail();

    $this->actingAs($this->user)
        ->post("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/travel-documents", [
            'passengers' => [[
                'id' => $passenger->id,
                'passport_number' => 'P456',
                'passport_issue_date' => now()->subYear()->toDateString(),
                'passport_expiry_date' => now()->addYears(4)->toDateString(),
                'passport_file_path' => 'travel-documents/passports/updated.pdf',
                'visa_number' => 'V456',
                'visa_file_path' => 'travel-documents/visas/updated.pdf',
            ]],
        ])
        ->assertRedirect();

    $passenger->refresh();
    expect($passenger->passport_number)->toBe('P456')
        ->and($passenger->visa_number)->toBe('V456');
});

test('dashboard document updates clear removed file paths', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::FULL_PAYMENT,
    ]);
    $passenger = BookingPassenger::create([
        'booking_id' => $booking->id,
        'title' => 'Mr',
        'first_name' => 'Remove',
        'last_name' => 'Docs',
        'dob' => now()->subYears(30)->toDateString(),
        'pob' => 'Jakarta',
        'price_category' => 'Adult Twin',
        'price_amount' => 1_000_000,
        'passport_number' => 'P123',
        'passport_issue_date' => now()->subYear()->toDateString(),
        'passport_expiry_date' => now()->addYears(4)->toDateString(),
        'passport_file_path' => 'travel-documents/passports/old-passport.pdf',
        'visa_number' => 'V123',
        'visa_file_path' => 'travel-documents/visas/old-visa.pdf',
    ]);

    $this->actingAs($this->user)
        ->post("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/travel-documents", [
            'passengers' => [[
                'id' => $passenger->id,
                'passport_number' => 'P123',
                'passport_issue_date' => now()->subYear()->toDateString(),
                'passport_expiry_date' => now()->addYears(4)->toDateString(),
                'visa_number' => 'V123',
            ]],
        ])
        ->assertRedirect();

    $passenger->refresh();

    expect($passenger->passport_file_path)->toBeNull()
        ->and($passenger->visa_file_path)->toBeNull();
});

test('booking index limits remaining balance to down payment and hides followups for terminal statuses', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);

    createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::DOWN_PAYMENT,
        'booking_number' => 'BKG-REMAINING-DP',
        'grand_total' => 1_000_000,
    ]);

    createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
        'booking_number' => 'BKG-REMAINING-WA',
        'grand_total' => 1_000_000,
    ]);

    createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::CANCELLED,
        'booking_number' => 'BKG-TERMINAL-CA',
        'grand_total' => 1_000_000,
    ]);

    createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::REFUNDED,
        'booking_number' => 'BKG-TERMINAL-RF',
        'grand_total' => 1_000_000,
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings?sort=booking_number");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('data.data.0.booking_number', 'BKG-REMAINING-DP')
        ->where('data.data.0.remaining_balance_visible', true)
        ->where('data.data.1.booking_number', 'BKG-REMAINING-WA')
        ->where('data.data.1.remaining_balance_visible', false)
        ->where('data.data.2.booking_number', 'BKG-TERMINAL-CA')
        ->where('data.data.2.payment_followup.state', 'not_applicable')
        ->where('data.data.2.document_followup.state', 'not_applicable')
        ->where('data.data.3.booking_number', 'BKG-TERMINAL-RF')
        ->where('data.data.3.payment_followup.state', 'not_applicable')
        ->where('data.data.3.document_followup.state', 'not_applicable'));
});

test('booking index exposes continue booking action for awaiting payment bookings', function () {
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

    createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::AWAITING_PAYMENT,
        'booking_number' => 'BKG-CONTINUE-WP',
        'departure_date' => $departureDate,
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('data.data.0.continue_booking_url', "/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}?date={$departureDate}&booking_number=BKG-CONTINUE-WP"));
});

test('booking index hides continue booking action for agents without catalog access to the tour', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $agent = Company::factory()->create(['type' => 'agent']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $departureDate = now()->addMonth()->toDateString();

    CompanyTeam::create([
        'company_id' => $agent->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::AWAITING_PAYMENT,
        'booking_number' => 'BKG-AGENT-NO-CATALOG',
        'departure_date' => $departureDate,
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$agent->username}/dashboard/bookings");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('data.data.0.continue_booking_url', null));
});

test('booking index exposes completed document detail links', function () {
    Storage::fake('public');
    Storage::disk('public')->put('travel-documents/passports/complete-passport.pdf', 'passport');
    Storage::disk('public')->put('travel-documents/visas/complete-visa.pdf', 'visa');

    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::DOWN_PAYMENT,
        'booking_number' => 'BKG-DOCS-COMPLETE',
    ]);

    BookingPassenger::create([
        'booking_id' => $booking->id,
        'title' => 'Ms',
        'first_name' => 'Complete',
        'last_name' => 'Docs',
        'dob' => now()->subYears(30)->toDateString(),
        'price_category' => 'Adult Twin',
        'price_amount' => 1_000_000,
        'passport_number' => 'P1234567',
        'passport_issue_date' => now()->subYear()->toDateString(),
        'passport_expiry_date' => now()->addYears(4)->toDateString(),
        'passport_file_path' => 'travel-documents/passports/complete-passport.pdf',
        'visa_number' => 'V1234567',
        'visa_file_path' => 'travel-documents/visas/complete-visa.pdf',
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$vendor->username}/dashboard/bookings");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('data.data.0.document_followup.state', 'completed')
        ->where('data.data.0.document_followup.action_label', 'View Documents')
        ->has('data.data.0.document_detail', 1)
        ->where('data.data.0.document_detail.0.passenger_name', 'Complete Docs')
        ->where('data.data.0.document_detail.0.passport_file_name', 'complete-passport.pdf')
        ->where('data.data.0.document_detail.0.visa_file_name', 'complete-visa.pdf')
        ->where('data.data.0.document_detail.0.passport_file_url', Storage::disk('public')->url('travel-documents/passports/complete-passport.pdf'))
        ->where('data.data.0.document_detail.0.visa_file_url', Storage::disk('public')->url('travel-documents/visas/complete-visa.pdf')));
});

test('dashboard hold expiry resolution is idempotent after booking state changes', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);

    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = createBookingWithSchedule(1, [
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
        'reserved_type' => 'payment_in_progress',
        'reserved_expires_at' => null,
    ]);

    $this->actingAs($this->user)
        ->post("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/resolve-hold-expiry", [
            'resolution' => 'payment_in_progress',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($booking->fresh()->status)->toBe(BookingStatus::WAITING_PAYMENT_APPROVAL);
});
