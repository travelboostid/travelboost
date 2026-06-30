<?php

use App\Actions\Booking\SyncAvailabilityAction;
use App\Enums\BookingStatus;
use App\Enums\CompanyTeamStatus;
use App\Enums\VendorAgentPartnerStatus;
use App\Models\AgentTier;
use App\Models\AgentTour;
use App\Models\Booking;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Media;
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
use Database\Seeders\Common\RolePermissionSeeder;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);
    DB::table('continents')->insertOrIgnore(['id' => 1, 'name' => 'Asia']);
    DB::table('regions')->insertOrIgnore(['id' => 1, 'name' => 'Southeast Asia', 'continent_id' => 1]);
    DB::table('countries')->insertOrIgnore(['id' => 1, 'name' => 'Indonesia', 'continent_id' => 1, 'region_id' => 1]);
    DB::table('agent_subscription_packages')->insertOrIgnore([
        [
            'id' => 1,
            'name' => 'Free Trial 1 Month',
            'duration_months' => 1,
            'price' => 0,
            'is_active' => true,
        ],
        [
            'id' => 2,
            'name' => 'Basic Subscription',
            'duration_months' => 1,
            'price' => 100000,
            'is_active' => true,
        ],
    ]);
});

function attachDashboardUserToCompany(User $user, Company $company, ?string $roleName = null, ?string $roleDisplayName = null): void
{
    if ($roleName !== null) {
        Role::query()->updateOrCreate(
            ['name' => $roleName],
            [
                'display_name' => $roleDisplayName ?? str($roleName)->afterLast(':')->title()->toString(),
                'description' => $roleDisplayName ?? str($roleName)->afterLast(':')->title()->toString(),
            ],
        );
    }

    CompanyTeam::create([
        'company_id' => $company->id,
        'user_id' => $user->id,
        'invite_role' => $roleName,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);

    $roles = match ($company->type) {
        'vendor' => ['user:vendor'],
        'agent' => ['user:agent'],
        default => [],
    };

    if ($roleName !== null) {
        $roles[] = $roleName;
    }

    if ($roles !== []) {
        $user->addRoles($roles);
    }
}

/**
 * @return array{vendor: Company, tour: Tour, schedule: TourSchedule}
 */
function createPricedDashboardTour(): array
{
    $vendor = Company::factory()->create([
        'type' => 'vendor',
    ]);
    $vendor->companySetting()->updateOrCreate([], [
        'booking_deadline' => 0,
        'booking_entry_time_limit' => 20,
        'minimum_down_payment' => 30,
        'minimum_vat' => 11,
        'manual_bank_transfer' => 'BCA',
        'manual_bank_transfer_account_name' => 'Vendor Account',
        'manual_bank_transfer_account_number' => '1234567890',
    ]);

    $tour = Tour::factory()->create([
        'company_id' => $vendor->id,
        'status' => 'active',
    ]);

    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $vendor->id,
        'departure_date' => now()->addDays(45)->toDateString(),
        'return_date' => now()->addDays(50)->toDateString(),
        'is_active' => true,
    ]);

    TourAvailability::create([
        'company_id' => $vendor->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 10,
        'available' => 10,
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
        'price' => 5_000_000,
        'promotion' => 500_000,
    ]);

    $adultSingle = PriceCategory::create([
        'company_id' => $vendor->id,
        'name' => 'Adult Single',
        'room_type' => 'single',
    ]);

    TourPrice::create([
        'company_id' => $vendor->id,
        'tour_code' => $tour->code,
        'schedule_id' => $schedule->id,
        'price_category_id' => $adultSingle->id,
        'currency' => 'IDR',
        'price' => 7_000_000,
    ]);

    return compact('vendor', 'tour', 'schedule');
}

function dashboardBookingPayload(Tour $tour, TourSchedule $schedule, Company $vendor, ?Company $agent = null, string $contactEmail = 'customer@example.test', ?string $bookingNumber = null): array
{
    return [
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'pax_adult' => 1,
        'pax_child' => 0,
        'pax_infant' => 0,
        'vendor_id' => $vendor->id,
        'agent_id' => $agent?->id,
        'booking_number' => $bookingNumber ?? 'DASH-'.strtoupper(fake()->bothify('????-####')),
        'contact_name' => 'Dashboard Customer',
        'contact_email' => $contactEmail,
        'contact_phone' => '08123456789',
        'contact_notes' => null,
        'payment_type' => 'full_payment',
        'payment_method' => 'manual_transfer',
        'passengers' => [[
            'title' => 'Mr',
            'first_name' => 'Dashboard',
            'last_name' => 'Customer',
            'gender' => null,
            'dob' => now()->subYears(30)->toDateString(),
            'pob' => 'Jakarta',
            'price_category' => 'Adult Twin',
            'price_amount' => 1,
            'room_type' => 'Twin',
            'room_number' => null,
            'note' => null,
        ]],
        'addons' => [],
        'rooms' => [],
        'total_price' => 1,
        'tax_amount' => 1,
        'platform_fee' => 1,
        'commission_amount' => 1,
        'grand_total' => 1,
    ];
}

function createActiveDashboardAgentPartner(Company $vendor, int $packageId = 2, array $attributes = [], ?Tour $catalogTour = null): Company
{
    $agent = Company::factory()->create(array_merge([
        'type' => 'agent',
        'name' => 'Partner Agent',
        'email' => fake()->unique()->safeEmail(),
    ], $attributes));

    $agent->agentSubscription()->create([
        'package_id' => $packageId,
        'started_at' => now()->subDay(),
        'ended_at' => now()->addMonth(),
    ]);

    VendorAgentPartner::create([
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'status' => VendorAgentPartnerStatus::ACTIVE,
        'accepted_at' => now(),
    ]);

    if ($catalogTour !== null) {
        AgentTour::create([
            'company_id' => $agent->id,
            'tour_id' => $catalogTour->id,
            'status' => 'active',
        ]);
    }

    return $agent;
}

test('agent my catalog exposes schedule prices from vendor tour prices', function () {
    ['vendor' => $vendor, 'tour' => $tour] = createPricedDashboardTour();
    $agent = Company::factory()->create(['type' => 'agent']);
    $user = User::factory()->create();
    attachDashboardUserToCompany($user, $agent);

    AgentTour::create([
        'company_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => 'active',
    ]);

    $response = $this->actingAs($user)
        ->get("/companies/{$agent->username}/dashboard/agent-tours");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('companies/dashboard/agent-tours/index')
        ->where('data.0.tour.schedules.0.price', 4_500_000));
});

test('vendor catalog exposes schedule prices from minimum vendor tour price category', function () {
    ['vendor' => $vendor] = createPricedDashboardTour();
    $user = User::factory()->create();
    attachDashboardUserToCompany($user, $vendor);

    $response = $this->actingAs($user)
        ->get("/companies/{$vendor->username}/dashboard/vendors/{$vendor->username}/tours");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('companies/dashboard/vendor-tours/index')
        ->where('data.0.schedules.0.price', 4_500_000));
});

test('agent vendor catalog exposes schedule prices from minimum vendor tour price category', function () {
    ['vendor' => $vendor, 'tour' => $tour] = createPricedDashboardTour();
    $agent = Company::factory()->create(['type' => 'agent']);
    $user = User::factory()->create();
    attachDashboardUserToCompany($user, $agent);

    $tier = AgentTier::create([
        'company_id' => $vendor->id,
        'name' => 'Gold',
        'slug' => 'gold',
        'sort_order' => 1,
        'is_active' => true,
    ]);

    $commissionCategory = ProductCommissionCategory::query()->create([
        'category_name' => 'Produk Promo',
        'description' => 'Produk Promo',
        'slug' => 'produk-promo',
        'sort_order' => 2,
        'is_active' => true,
    ]);

    $tour->update([
        'product_commission_category_id' => $commissionCategory->id,
    ]);

    TourCommissionRule::create([
        'company_id' => $vendor->id,
        'tour_id' => null,
        'agent_tier_id' => $tier->id,
        'product_commission_category_id' => $commissionCategory->id,
        'commission_type' => 'percent',
        'commission_value' => 10,
        'is_active' => true,
    ]);

    VendorAgentPartner::create([
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'agent_tier_id' => $tier->id,
        'status' => 'active',
    ]);

    AgentTour::create([
        'company_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => 'active',
    ]);

    $response = $this->actingAs($user)
        ->get("/companies/{$agent->username}/dashboard/vendors/{$vendor->username}/tours");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('companies/dashboard/vendor-tours/index')
        ->where('data.0.schedules.0.price', 4_500_000)
        ->where('partnership.agent_tier_id', $tier->id));

    $detailsResponse = $this->actingAs($user)
        ->getJson("/companies/{$agent->username}/dashboard/vendors/{$vendor->username}/tours/{$tour->id}/details");

    $detailsResponse->assertOk();
    $detailsResponse->assertJsonPath('schedules.0.prices.0.price', '5000000.00');
    $detailsResponse->assertJsonCount(1, 'commission_rules');
    $detailsResponse->assertJsonPath('commission_rules.0.commission_value', '10.00');
});

test('vendor can toggle agent itinerary upload permission from agent registrations', function () {
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $vendorUser = User::factory()->create();
    attachDashboardUserToCompany($vendorUser, $vendor);

    $agent = Company::factory()->create(['type' => 'agent']);

    $partnership = VendorAgentPartner::create([
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'status' => VendorAgentPartnerStatus::ACTIVE,
        'accepted_at' => now(),
        'agent_itinerary_upload_enabled' => false,
    ]);

    $response = $this->actingAs($vendorUser)->put(
        "/companies/{$vendor->username}/dashboard/agent-registrations/{$partnership->id}",
        ['agent_itinerary_upload_enabled' => true],
    );

    $response->assertRedirect();

    expect($partnership->fresh()->agent_itinerary_upload_enabled)->toBeTrue();
});

test('agent tours expose itinerary upload permission per vendor partnership', function () {
    ['vendor' => $vendor, 'tour' => $tour] = createPricedDashboardTour();

    $agent = Company::factory()->create(['type' => 'agent']);
    $agentUser = User::factory()->create();
    attachDashboardUserToCompany($agentUser, $agent);

    VendorAgentPartner::create([
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'status' => VendorAgentPartnerStatus::ACTIVE,
        'accepted_at' => now(),
        'agent_itinerary_upload_enabled' => false,
    ]);

    AgentTour::create([
        'company_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => 'active',
    ]);

    $response = $this->actingAs($agentUser)
        ->get("/companies/{$agent->username}/dashboard/agent-tours");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('companies/dashboard/agent-tours/index')
        ->where('data.0.agent_itinerary_upload_enabled', false));
});

test('agent dashboard catalog prefers vendor itinerary when agent upload is disabled', function () {
    ['vendor' => $vendor, 'tour' => $tour] = createPricedDashboardTour();

    $vendorDocument = Media::create([
        'owner_type' => Company::class,
        'owner_id' => $vendor->id,
        'name' => 'vendor-itinerary.pdf',
        'type' => 'document',
        'subtype' => 'tour-document',
        'data' => [
            'url' => '/storage/media/documents/vendor-itinerary.pdf',
            'mediaType' => 'application/pdf',
        ],
    ]);

    $agent = Company::factory()->create(['type' => 'agent']);
    $agentUser = User::factory()->create();
    attachDashboardUserToCompany($agentUser, $agent);

    $agentDocument = Media::create([
        'owner_type' => Company::class,
        'owner_id' => $agent->id,
        'name' => 'agent-itinerary.pdf',
        'type' => 'document',
        'subtype' => 'agent-itinerary',
        'data' => [
            'url' => '/storage/media/documents/agent-itinerary.pdf',
            'mediaType' => 'application/pdf',
        ],
    ]);

    $tour->update([
        'document_id' => $vendorDocument->id,
    ]);

    VendorAgentPartner::create([
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'status' => VendorAgentPartnerStatus::ACTIVE,
        'accepted_at' => now(),
        'agent_itinerary_upload_enabled' => false,
    ]);

    AgentTour::create([
        'company_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => 'active',
        'agent_document_id' => $agentDocument->id,
    ]);

    $response = $this->actingAs($agentUser)
        ->get("/companies/{$agent->username}/dashboard/vendors/{$vendor->username}/tours");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('companies/dashboard/vendor-tours/index')
        ->where('data.0.agent_itinerary_upload_enabled', false)
        ->where('data.0.vendor_document_url', '/storage/media/documents/vendor-itinerary.pdf')
        ->where('data.0.agent_document_url', '/storage/media/documents/agent-itinerary.pdf')
        ->where('data.0.itinerary_document_source', 'vendor')
        ->where('data.0.itinerary_document_url', '/storage/media/documents/vendor-itinerary.pdf'));
});

test('dashboard booking create page uses customer wizard with dashboard endpoints', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule] = createPricedDashboardTour();
    $user = User::factory()->create();
    $operatorRole = "company:{$vendor->id}:operator";
    attachDashboardUserToCompany($user, $vendor, $operatorRole, 'Operator');
    $agent = createActiveDashboardAgentPartner($vendor, catalogTour: $tour);
    $customer = User::factory()->create([
        'company_id' => $agent->id,
        'name' => 'Existing Customer',
        'email' => 'existing-customer@example.test',
        'phone' => '0811111111',
    ]);
    $bookingCountBefore = Booking::query()->count();

    $response = $this->actingAs($user)
        ->get("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}?date={$schedule->departure_date}");

    expect(Booking::query()->count())->toBe($bookingCountBefore);

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tours/bookings/create')
        ->where('serverNow', fn (?string $value): bool => is_string($value) && str_contains($value, 'T'))
        ->where('bookingNumber', null)
        ->where('dashboardBookingContext.isDashboard', true)
        ->where('dashboardBookingContext.reserveUrl', "/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}/reserve")
        ->where('dashboardBookingContext.storeUrl', "/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}")
        ->where('vendor.id', $vendor->id)
        ->where('tenant', null)
        ->where('tourPrices.0.categoryName', 'Adult Twin')
        ->where('tourPrices.0.price', 5_000_000)
        ->where('customerOptions.0.id', $customer->id)
        ->where('customerOptions.0.email', 'existing-customer@example.test')
        ->where('customerOptions.0.company_id', $agent->id)
        ->where('requiresAgentSelection', true)
        ->where('agentOptions.0.id', $agent->id)
        ->where('agentOptions.0.name', 'Partner Agent')
        ->where('inputBy.user_name', $user->name)
        ->where('inputBy.company_name', $vendor->name)
        ->where('inputBy.role_label', 'Operator'));
});

test('dashboard booking create resume exposes stored input by audit payload', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule] = createPricedDashboardTour();
    $dashboardUser = User::factory()->create();
    $creator = User::factory()->create(['name' => 'Original Staff']);
    attachDashboardUserToCompany($dashboardUser, $vendor);
    $agent = createActiveDashboardAgentPartner($vendor, catalogTour: $tour);
    $supportRole = "company:{$agent->id}:support";
    Role::query()->create([
        'name' => $supportRole,
        'display_name' => 'Support',
        'description' => 'Support',
    ]);

    $booking = Booking::factory()->create([
        'user_id' => $dashboardUser->id,
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $tour->id,
        'booking_number' => 'DASH-RESUME-123',
        'departure_date' => $schedule->departure_date,
        'input_by_user_id' => $creator->id,
        'input_by_company_id' => $agent->id,
        'input_by_role' => $supportRole,
    ]);

    $response = $this->actingAs($dashboardUser)
        ->get("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}?date={$schedule->departure_date}&booking_number={$booking->booking_number}&step=payment");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tours/bookings/create')
        ->where('bookingNumber', $booking->booking_number)
        ->where('isResumingExistingBooking', true)
        ->where('inputBy.user_name', 'Original Staff')
        ->where('inputBy.company_name', $agent->name)
        ->where('inputBy.role_label', 'Support')
        ->where('inputBy.created_at', $booking->fresh()->created_at->toJSON()));
});

test('vendor dashboard booking create exposes customers from all subscribed agent partners', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule] = createPricedDashboardTour();
    $user = User::factory()->create();
    attachDashboardUserToCompany($user, $vendor);
    $paidAgent = createActiveDashboardAgentPartner($vendor, 2, ['name' => 'Paid Agent']);
    $freeTrialAgent = createActiveDashboardAgentPartner($vendor, 1, ['name' => 'Free Trial Agent']);
    User::factory()->create([
        'company_id' => $vendor->id,
        'name' => 'Vendor Customer',
        'email' => 'vendor-customer@example.test',
    ]);
    $paidAgentCustomer = User::factory()->create([
        'company_id' => $paidAgent->id,
        'name' => 'Paid Agent Customer',
        'email' => 'paid-agent-customer@example.test',
    ]);
    $freeTrialCustomer = User::factory()->create([
        'company_id' => $freeTrialAgent->id,
        'name' => 'Free Trial Customer',
        'email' => 'free-trial-customer@example.test',
    ]);

    $response = $this->actingAs($user)
        ->get("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}?date={$schedule->departure_date}");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tours/bookings/create')
        ->has('customerOptions', 2)
        ->where('customerOptions', fn ($customers) => collect($customers)->pluck('id')->sort()->values()->all() === collect([
            $freeTrialCustomer->id,
            $paidAgentCustomer->id,
        ])->sort()->values()->all()));
});

test('dashboard booking create exposes saved passengers scoped to eligible agent customers', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule] = createPricedDashboardTour();
    $user = User::factory()->create();
    attachDashboardUserToCompany($user, $vendor);
    $paidAgent = createActiveDashboardAgentPartner($vendor, 2, ['name' => 'Paid Agent']);
    $otherPaidAgent = createActiveDashboardAgentPartner($vendor, 2, ['name' => 'Other Paid Agent']);
    $freeTrialAgent = createActiveDashboardAgentPartner($vendor, 1, ['name' => 'Free Trial Agent']);

    $paidAgentCustomer = User::factory()->create([
        'company_id' => $paidAgent->id,
        'name' => 'Paid Agent Customer',
        'email' => 'paid-agent-customer-saved@example.test',
        'note' => 'Prefers aisle seats.',
    ]);
    $otherPaidAgentCustomer = User::factory()->create([
        'company_id' => $otherPaidAgent->id,
        'name' => 'Other Paid Agent Customer',
        'email' => 'other-paid-agent-customer-saved@example.test',
    ]);
    $freeTrialCustomer = User::factory()->create([
        'company_id' => $freeTrialAgent->id,
        'name' => 'Free Trial Customer',
        'email' => 'free-trial-customer-saved@example.test',
    ]);

    $paidAgentCustomer->savedPassengers()->create([
        'first_name' => 'Paid',
        'last_name' => 'Passenger',
        'dob' => now()->subYears(30)->toDateString(),
        'passport_number' => 'PAID-PASSPORT',
    ]);
    $otherPaidAgentCustomer->savedPassengers()->create([
        'first_name' => 'Other',
        'last_name' => 'Passenger',
        'dob' => now()->subYears(30)->toDateString(),
        'passport_number' => 'OTHER-PASSPORT',
    ]);
    $freeTrialCustomer->savedPassengers()->create([
        'first_name' => 'Trial',
        'last_name' => 'Passenger',
        'dob' => now()->subYears(30)->toDateString(),
        'passport_number' => 'TRIAL-PASSPORT',
    ]);

    $response = $this->actingAs($user)
        ->get("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}?date={$schedule->departure_date}");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tours/bookings/create')
        ->has('savedPassengers', 3)
        ->where('savedPassengers', fn ($passengers) => collect($passengers)->pluck('passportNumber')->sort()->values()->all() === [
            'OTHER-PASSPORT',
            'PAID-PASSPORT',
            'TRIAL-PASSPORT',
        ]));
});

test('vendor dashboard booking create exposes active partners including free trial package', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule] = createPricedDashboardTour();
    $user = User::factory()->create();
    attachDashboardUserToCompany($user, $vendor);
    $freeTrialAgent = createActiveDashboardAgentPartner($vendor, 1, ['name' => 'Free Trial Agent'], $tour);
    $paidAgent = createActiveDashboardAgentPartner($vendor, 2, ['name' => 'Paid Agent'], $tour);

    $response = $this->actingAs($user)
        ->get("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}?date={$schedule->departure_date}");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tours/bookings/create')
        ->where('requiresAgentSelection', true)
        ->has('agentOptions', 2)
        ->where('agentOptions', fn ($agents) => collect($agents)->pluck('id')->sort()->values()->all() === collect([
            $freeTrialAgent->id,
            $paidAgent->id,
        ])->sort()->values()->all()));
});

test('vendor dashboard booking create exposes no agent options when there are no active partners', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule] = createPricedDashboardTour();
    $user = User::factory()->create();
    attachDashboardUserToCompany($user, $vendor);

    $response = $this->actingAs($user)
        ->get("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}?date={$schedule->departure_date}");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tours/bookings/create')
        ->where('requiresAgentSelection', true)
        ->has('agentOptions', 0));
});

test('vendor dashboard booking create only exposes agents who saved the tour to their catalog', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule] = createPricedDashboardTour();
    $user = User::factory()->create();
    attachDashboardUserToCompany($user, $vendor);
    $catalogedAgent = createActiveDashboardAgentPartner($vendor, 2, ['name' => 'Cataloged Agent'], $tour);
    createActiveDashboardAgentPartner($vendor, 2, ['name' => 'Partner Without Catalog']);

    $response = $this->actingAs($user)
        ->get("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}?date={$schedule->departure_date}");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tours/bookings/create')
        ->has('agentOptions', 1)
        ->where('agentOptions.0.id', $catalogedAgent->id)
        ->where('agentOptions.0.name', 'Cataloged Agent'));
});

test('vendor dashboard booking reserve rejects active partners without catalog access to the tour', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule] = createPricedDashboardTour();
    $dashboardUser = User::factory()->create();
    attachDashboardUserToCompany($dashboardUser, $vendor);
    $agent = createActiveDashboardAgentPartner($vendor, 2, ['name' => 'Partner Without Catalog']);
    $payload = dashboardBookingPayload($tour, $schedule, $vendor, $agent, 'guest-without-account@example.test');

    $this->actingAs($dashboardUser)
        ->from("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}?date={$schedule->departure_date}")
        ->post("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}/reserve", $payload)
        ->assertSessionHasErrors('agent_id');

    expect(Booking::query()->count())->toBe(0);
});

test('dashboard booking create exposes commission values from selected schedule price category', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'schedule' => $firstSchedule] = createPricedDashboardTour();
    $user = User::factory()->create();
    attachDashboardUserToCompany($user, $vendor);

    $adultTwin = PriceCategory::where('company_id', $vendor->id)
        ->where('name', 'Adult Twin')
        ->firstOrFail();

    TourPrice::query()
        ->where('schedule_id', $firstSchedule->id)
        ->where('price_category_id', $adultTwin->id)
        ->update([
            'commission' => 350_000,
            'commission_rate' => 0,
        ]);

    $secondSchedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $vendor->id,
        'departure_date' => now()->addDays(60)->toDateString(),
        'return_date' => now()->addDays(65)->toDateString(),
        'is_active' => true,
    ]);

    TourAvailability::create([
        'company_id' => $vendor->id,
        'tour_id' => $tour->id,
        'schedule_id' => $secondSchedule->id,
        'max_pax' => 10,
        'available' => 10,
    ]);

    TourPrice::create([
        'company_id' => $vendor->id,
        'tour_code' => $tour->code,
        'schedule_id' => $secondSchedule->id,
        'price_category_id' => $adultTwin->id,
        'currency' => 'IDR',
        'price' => 6_000_000,
        'commission' => 0,
        'commission_rate' => 12,
    ]);

    $response = $this->actingAs($user)
        ->get("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}?date={$secondSchedule->departure_date}");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tours/bookings/create')
        ->where('tourPrices.0.price', 6_000_000)
        ->where('tourPrices.0.commission', 0)
        ->where('tourPrices.0.commissionRate', 12));
});

test('dashboard reserve without booking number creates one booking and reuses it on later reserve', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule] = createPricedDashboardTour();
    $dashboardUser = User::factory()->create();
    $adminRole = "company:{$vendor->id}:admin";
    attachDashboardUserToCompany($dashboardUser, $vendor, $adminRole, 'Admin');
    $agent = createActiveDashboardAgentPartner($vendor, catalogTour: $tour);
    $payload = dashboardBookingPayload($tour, $schedule, $vendor, $agent, 'guest-without-account@example.test');
    $payload['booking_number'] = null;

    $this->actingAs($dashboardUser)
        ->post("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}/reserve", $payload)
        ->assertRedirect();

    $booking = Booking::query()->sole();
    expect($booking->booking_number)->not->toBeNull()
        ->and($booking->booking_number)->not->toBe('')
        ->and($booking->user_id)->toBe($dashboardUser->id)
        ->and($booking->agent_id)->toBe($agent->id)
        ->and($booking->input_by_user_id)->toBe($dashboardUser->id)
        ->and($booking->input_by_company_id)->toBe($vendor->id)
        ->and($booking->input_by_role)->toBe($adminRole);

    $payload['booking_number'] = $booking->booking_number;
    $payload['contact_phone'] = '0899999999';

    $this->actingAs($dashboardUser)
        ->post("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}/reserve", $payload)
        ->assertRedirect();

    expect(Booking::query()->count())->toBe(1);
    expect($booking->fresh()->contact_phone)->toBe('0899999999');
});

test('dashboard reserve reuses an existing booking number even when the owner changes', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule] = createPricedDashboardTour();
    $dashboardUser = User::factory()->create();
    attachDashboardUserToCompany($dashboardUser, $vendor);
    $agent = createActiveDashboardAgentPartner($vendor, catalogTour: $tour);
    $previousOwner = User::factory()->create([
        'email' => 'previous-owner@example.test',
    ]);
    $booking = Booking::factory()->create([
        'booking_number' => 'DASH-RESUME-OWNER-SWAP',
        'user_id' => $previousOwner->id,
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'status' => BookingStatus::BOOKING_RESERVED,
        'reserved_type' => 'system',
        'reserved_expires_at' => now()->addMinutes(10),
    ]);

    $payload = dashboardBookingPayload(
        $tour,
        $schedule,
        $vendor,
        $agent,
        'guest-without-account@example.test',
        $booking->booking_number,
    );
    $payload['contact_phone'] = '08911111111';

    $this->actingAs($dashboardUser)
        ->post("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}/reserve", $payload)
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(Booking::query()->count())->toBe(1);
    expect($booking->fresh()->user_id)->toBe($dashboardUser->id)
        ->and($booking->fresh()->contact_phone)->toBe('08911111111')
        ->and($booking->fresh()->booking_number)->toBe('DASH-RESUME-OWNER-SWAP');
});

test('dashboard reserve rejects more dependent bed passengers than twin or double base rooms', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule] = createPricedDashboardTour();
    $dashboardUser = User::factory()->create();
    attachDashboardUserToCompany($dashboardUser, $vendor);
    $agent = createActiveDashboardAgentPartner($vendor, catalogTour: $tour);

    $payload = dashboardBookingPayload($tour, $schedule, $vendor, $agent);
    $payload['pax_adult'] = 3;
    $payload['passengers'] = [
        [
            'title' => 'Mr',
            'first_name' => 'Base',
            'last_name' => 'Twin',
            'dob' => now()->subYears(30)->toDateString(),
            'pob' => 'Jakarta',
            'price_category' => 'Adult Twin',
            'price_amount' => 1_000_000,
            'room_type' => 'Twin',
        ],
        [
            'title' => 'Mr',
            'first_name' => 'Extra',
            'last_name' => 'One',
            'dob' => now()->subYears(30)->toDateString(),
            'pob' => 'Jakarta',
            'price_category' => 'Adult Extra Bed',
            'price_amount' => 500_000,
            'room_type' => 'Adult Extra Bed',
        ],
        [
            'title' => 'Mr',
            'first_name' => 'Extra',
            'last_name' => 'Two',
            'dob' => now()->subYears(30)->toDateString(),
            'pob' => 'Jakarta',
            'price_category' => 'Adult Extra Bed',
            'price_amount' => 500_000,
            'room_type' => 'Adult Extra Bed',
        ],
    ];

    $this->actingAs($dashboardUser)
        ->from("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}")
        ->post("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}/reserve", $payload)
        ->assertSessionHasErrors('passengers');
});

test('dashboard hold expiry can release a booking reserved hold back to awaiting payment', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule] = createPricedDashboardTour();
    $dashboardUser = User::factory()->create();
    attachDashboardUserToCompany($dashboardUser, $vendor);

    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'status' => 'booking reserved',
        'reserved_type' => 'system',
        'reserved_expires_at' => now()->subSecond(),
        'pax_adult' => 2,
        'pax_child' => 0,
        'pax_infant' => 0,
    ]);

    app(SyncAvailabilityAction::class)->executeForBooking($booking);

    $response = $this->actingAs($dashboardUser)
        ->post("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/resolve-hold-expiry", [
            'resolution' => 'awaiting_payment',
        ]);

    $response->assertRedirect();

    $availability = TourAvailability::query()
        ->where('schedule_id', $schedule->id)
        ->firstOrFail();

    expect($booking->fresh()->status)->toBe(BookingStatus::AWAITING_PAYMENT)
        ->and($booking->fresh()->reserved_type)->toBe('system')
        ->and($booking->fresh()->reserved_expires_at)->toBeNull()
        ->and((int) $availability->fresh()->BRS)->toBe(0)
        ->and((int) $availability->fresh()->WP)->toBe(2)
        ->and((int) $availability->fresh()->available)->toBe(10);
});

test('dashboard hold expiry can mark payment in progress as waiting payment approval', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule] = createPricedDashboardTour();
    $agent = Company::factory()->create(['type' => 'agent']);
    $dashboardUser = User::factory()->create();
    attachDashboardUserToCompany($dashboardUser, $agent);
    AgentTour::create([
        'company_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => 'active',
    ]);

    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'status' => 'booking reserved',
        'reserved_type' => 'system',
        'reserved_expires_at' => now()->subSecond(),
        'pax_adult' => 2,
        'pax_child' => 0,
        'pax_infant' => 0,
    ]);

    app(SyncAvailabilityAction::class)->executeForBooking($booking);

    $response = $this->actingAs($dashboardUser)
        ->post("/companies/{$agent->username}/dashboard/bookings/{$booking->id}/resolve-hold-expiry", [
            'resolution' => 'payment_in_progress',
        ]);

    $response->assertRedirect();

    $availability = TourAvailability::query()
        ->where('schedule_id', $schedule->id)
        ->firstOrFail();

    expect($booking->fresh()->status)->toBe(BookingStatus::WAITING_PAYMENT_APPROVAL)
        ->and($booking->fresh()->reserved_type)->toBe('payment_in_progress')
        ->and($booking->fresh()->reserved_expires_at)->toBeNull()
        ->and((int) $availability->fresh()->BRS)->toBe(0)
        ->and((int) $availability->fresh()->WPA)->toBe(2)
        ->and((int) $availability->fresh()->available)->toBe(8);
});

test('dashboard hold expiry rejects inaccessible bookings and ignores non reserved bookings safely', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule] = createPricedDashboardTour();
    $otherVendor = Company::factory()->create(['type' => 'vendor']);
    $dashboardUser = User::factory()->create();
    attachDashboardUserToCompany($dashboardUser, $otherVendor);

    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'status' => 'booking reserved',
        'reserved_type' => 'system',
        'reserved_expires_at' => now()->subSecond(),
    ]);

    $this->actingAs($dashboardUser)
        ->post("/companies/{$otherVendor->username}/dashboard/bookings/{$booking->id}/resolve-hold-expiry", [
            'resolution' => 'awaiting_payment',
        ])
        ->assertNotFound();

    $otherTour = Tour::factory()->create(['company_id' => $otherVendor->id]);
    $otherSchedule = TourSchedule::create([
        'tour_id' => $otherTour->id,
        'tour_code' => $otherTour->code,
        'company_id' => $otherVendor->id,
        'departure_date' => $schedule->departure_date,
        'return_date' => now()->addDays(50)->toDateString(),
        'is_active' => true,
    ]);
    TourAvailability::create([
        'company_id' => $otherVendor->id,
        'tour_id' => $otherTour->id,
        'schedule_id' => $otherSchedule->id,
        'max_pax' => 10,
        'available' => 8,
    ]);
    $downPaymentBooking = Booking::factory()->create([
        'vendor_id' => $otherVendor->id,
        'tour_id' => $otherTour->id,
        'departure_date' => $otherSchedule->departure_date,
        'status' => 'down payment',
        'reserved_type' => 'system',
        'reserved_expires_at' => now()->subSecond(),
    ]);

    $this->actingAs($dashboardUser)
        ->post("/companies/{$otherVendor->username}/dashboard/bookings/{$downPaymentBooking->id}/resolve-hold-expiry", [
            'resolution' => 'awaiting_payment',
        ])
        ->assertRedirect();
});

test('vendor dashboard booking reserve requires an active agent partner', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule] = createPricedDashboardTour();
    $dashboardUser = User::factory()->create();
    attachDashboardUserToCompany($dashboardUser, $vendor);
    $payload = dashboardBookingPayload($tour, $schedule, $vendor, null, 'guest-without-account@example.test');

    $this->actingAs($dashboardUser)
        ->from("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}?date={$schedule->departure_date}")
        ->post("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}/reserve", $payload)
        ->assertSessionHasErrors('agent_id');

    expect(Booking::query()->count())->toBe(0);
});

test('vendor dashboard booking reserve accepts active partners on the free trial package', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule] = createPricedDashboardTour();
    $dashboardUser = User::factory()->create();
    attachDashboardUserToCompany($dashboardUser, $vendor);
    $agent = createActiveDashboardAgentPartner($vendor, 1, ['name' => 'Free Trial Agent'], $tour);
    $payload = dashboardBookingPayload($tour, $schedule, $vendor, $agent, 'guest-without-account@example.test');

    $this->actingAs($dashboardUser)
        ->from("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}?date={$schedule->departure_date}")
        ->post("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}/reserve", $payload)
        ->assertRedirect();

    $booking = Booking::query()->sole();
    expect($booking->agent_id)->toBe($agent->id)
        ->and($booking->status)->toBe(BookingStatus::BOOKING_RESERVED);
});

test('dashboard booking store attaches existing contact customer as booking owner', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule] = createPricedDashboardTour();
    $agent = Company::factory()->create(['type' => 'agent']);
    $dashboardUser = User::factory()->create();
    $customer = User::factory()->create(['email' => 'real-customer@example.test']);
    $supportRole = "company:{$agent->id}:support";
    attachDashboardUserToCompany($dashboardUser, $agent, $supportRole, 'Support');
    AgentTour::create([
        'company_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => 'active',
    ]);

    $response = $this->actingAs($dashboardUser)
        ->post("/companies/{$agent->username}/dashboard/bookings/create/{$tour->id}", dashboardBookingPayload(
            $tour,
            $schedule,
            $vendor,
            $agent,
            $customer->email
        ));

    $response->assertRedirect();

    $booking = Booking::query()->latest('id')->firstOrFail();
    expect($booking->user_id)->toBe($customer->id)
        ->and($booking->vendor_id)->toBe($vendor->id)
        ->and($booking->agent_id)->toBe($agent->id)
        ->and($booking->input_by_user_id)->toBe($dashboardUser->id)
        ->and($booking->input_by_company_id)->toBe($agent->id)
        ->and($booking->input_by_role)->toBe($supportRole)
        ->and((float) $booking->grand_total)->toBe(5_020_000.0);
});

test('dashboard booking store falls back to dashboard user when contact email has no account', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule] = createPricedDashboardTour();
    $dashboardUser = User::factory()->create();
    attachDashboardUserToCompany($dashboardUser, $vendor);
    $agent = createActiveDashboardAgentPartner($vendor, catalogTour: $tour);

    $response = $this->actingAs($dashboardUser)
        ->post("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}", dashboardBookingPayload(
            $tour,
            $schedule,
            $vendor,
            $agent,
            'guest-without-account@example.test'
        ));

    $response->assertRedirect();

    $booking = Booking::query()->latest('id')->firstOrFail();
    expect($booking->user_id)->toBe($dashboardUser->id)
        ->and($booking->vendor_id)->toBe($vendor->id)
        ->and($booking->agent_id)->toBe($agent->id);
});

test('dashboard booking store persists passenger and contact notes', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule] = createPricedDashboardTour();
    $dashboardUser = User::factory()->create();
    attachDashboardUserToCompany($dashboardUser, $vendor);
    $agent = createActiveDashboardAgentPartner($vendor, catalogTour: $tour);
    $payload = dashboardBookingPayload(
        $tour,
        $schedule,
        $vendor,
        $agent,
        'note-customer@example.test',
        'DASH-NOTES-001'
    );
    $payload['contact_notes'] = 'Customer prefers vegetarian meals.';
    $payload['passengers'][0]['note'] = 'Window side seat.';

    $this->actingAs($dashboardUser)
        ->post("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}", $payload)
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $booking = Booking::query()->where('booking_number', 'DASH-NOTES-001')->firstOrFail();
    $passenger = $booking->passengers()->firstOrFail();

    expect($booking->contact_notes)->toBe('Customer prefers vegetarian meals.')
        ->and($passenger->note)->toBe('Window side seat.');
});

test('vendor dashboard booking store requires an active agent partner', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule] = createPricedDashboardTour();
    $dashboardUser = User::factory()->create();
    attachDashboardUserToCompany($dashboardUser, $vendor);

    $this->actingAs($dashboardUser)
        ->from("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}?date={$schedule->departure_date}")
        ->post("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}", dashboardBookingPayload(
            $tour,
            $schedule,
            $vendor,
            null,
            'guest-without-account@example.test'
        ))
        ->assertSessionHasErrors('agent_id');

    expect(Booking::query()->count())->toBe(0);
});

test('vendor dashboard booking store accepts active partners on the free trial package', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule] = createPricedDashboardTour();
    $dashboardUser = User::factory()->create();
    attachDashboardUserToCompany($dashboardUser, $vendor);
    $agent = createActiveDashboardAgentPartner($vendor, 1, ['name' => 'Free Trial Agent'], $tour);

    $this->actingAs($dashboardUser)
        ->from("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}?date={$schedule->departure_date}")
        ->post("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}", dashboardBookingPayload(
            $tour,
            $schedule,
            $vendor,
            $agent,
            'guest-without-account@example.test'
        ))
        ->assertRedirect();

    $booking = Booking::query()->sole();
    expect($booking->agent_id)->toBe($agent->id);
});

test('dashboard booking store without booking number generates one booking number', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule] = createPricedDashboardTour();
    $dashboardUser = User::factory()->create();
    attachDashboardUserToCompany($dashboardUser, $vendor);
    $agent = createActiveDashboardAgentPartner($vendor, catalogTour: $tour);
    $payload = dashboardBookingPayload(
        $tour,
        $schedule,
        $vendor,
        $agent,
        'store-guest-without-account@example.test',
    );
    $payload['booking_number'] = null;

    $response = $this->actingAs($dashboardUser)
        ->post("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}", $payload);

    $response->assertRedirect();

    $booking = Booking::query()->sole();
    expect($booking->booking_number)->not->toBeNull()
        ->and($booking->booking_number)->not->toBe('')
        ->and($booking->user_id)->toBe($dashboardUser->id);
});

test('dashboard booking store reuses an existing booking number even when the owner changes', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule] = createPricedDashboardTour();
    $dashboardUser = User::factory()->create();
    attachDashboardUserToCompany($dashboardUser, $vendor);
    $agent = createActiveDashboardAgentPartner($vendor, catalogTour: $tour);
    $previousOwner = User::factory()->create([
        'email' => 'store-previous-owner@example.test',
    ]);
    $booking = Booking::factory()->create([
        'booking_number' => 'DASH-STORE-OWNER-SWAP',
        'user_id' => $previousOwner->id,
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'status' => BookingStatus::BOOKING_RESERVED,
        'reserved_type' => 'system',
        'reserved_expires_at' => now()->addMinutes(10),
    ]);

    $payload = dashboardBookingPayload(
        $tour,
        $schedule,
        $vendor,
        $agent,
        'guest-store-without-account@example.test',
        $booking->booking_number,
    );
    $payload['contact_phone'] = '08922222222';

    $this->actingAs($dashboardUser)
        ->post("/companies/{$vendor->username}/dashboard/bookings/create/{$tour->id}", $payload)
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(Booking::query()->count())->toBe(1);
    expect($booking->fresh()->user_id)->toBe($dashboardUser->id)
        ->and($booking->fresh()->contact_phone)->toBe('08922222222')
        ->and($booking->fresh()->booking_number)->toBe('DASH-STORE-OWNER-SWAP');
});
