<?php

use App\Enums\BookingStatus;
use App\Enums\UserStatus;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Booking;
use App\Models\Company;
use App\Models\Domain;
use App\Models\Tour;
use App\Models\TourAvailability;
use App\Models\TourSchedule;
use App\Models\User;
use Database\Seeders\Common\RolePermissionSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);
    Booking::unsetEventDispatcher();
    DB::table('continents')->insertOrIgnore(['id' => 1, 'name' => 'Asia']);
    DB::table('regions')->insertOrIgnore(['id' => 1, 'name' => 'Southeast Asia', 'continent_id' => 1]);
    DB::table('countries')->insertOrIgnore(['id' => 1, 'name' => 'Indonesia', 'continent_id' => 1, 'region_id' => 1]);
});

test('guests can view the my bookings page shell', function () {
    $response = $this->get('/mybookings');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('me/bookings')
        ->where('bookings', null)
        ->where('favorites', null)
        ->where('activeTab', 'current'));
});

test('shared tenant props include landing page settings for navbar branding', function () {
    $company = Company::factory()->create([
        'username' => 'john',
        'type' => 'agent',
        'name' => 'John Company',
    ]);
    $landingPageData = json_encode([
        'root' => [
            'props' => [
                'title' => 'Travel',
                'theme' => 'dark',
            ],
        ],
    ]);

    $company->settings()->updateOrCreate([
        'company_id' => $company->id,
    ], [
        'landing_page_data' => $landingPageData,
    ]);

    $request = Request::create('/mybookings');
    $request->attributes->set('tenant', $company);
    $request->setLaravelSession(app('session')->driver());

    $shared = app(HandleInertiaRequests::class)->share($request);

    expect($shared['tenant']->settings->landing_page_data)->toBe($landingPageData);
});

test('agent subdomains can view my bookings when subdomain access is enabled', function () {
    $company = Company::factory()->create([
        'username' => 'mybookingagent',
        'type' => 'agent',
    ]);
    Domain::create([
        'subdomain' => 'mybookingagent',
        'owner_type' => Company::class,
        'owner_id' => $company->id,
        'domain_enabled' => false,
        'subdomain_enabled' => true,
    ]);

    $response = $this->get('http://mybookingagent.lvh.me/mybookings');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('me/bookings')
        ->where('activeTab', 'current'));
});

test('authenticated users see only active and future bookings in current and terminal bookings in history', function () {
    $user = User::factory()->create(['status' => UserStatus::ACTIVE]);
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);

    Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'reserved',
        'booking_number' => 'BKG-CURRENT-001',
        'departure_date' => now()->addDays(10)->toDateString(),
        'created_at' => now()->subDays(6),
    ]);

    Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'expired',
        'booking_number' => 'BKG-CURRENT-EXPIRED',
        'departure_date' => now()->addDays(8)->toDateString(),
        'created_at' => now()->subDays(5),
    ]);

    Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'awaiting payment',
        'booking_number' => 'BKG-CURRENT-AWAITING',
        'departure_date' => now()->addDays(6)->toDateString(),
        'created_at' => now()->subDays(4),
    ]);

    Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'full payment',
        'booking_number' => 'BKG-CURRENT-FUTURE-FP',
        'departure_date' => now()->addDays(4)->toDateString(),
        'created_at' => now()->subDays(3),
    ]);

    Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'expired',
        'booking_number' => 'BKG-HIDDEN-PAST-EXPIRED',
        'departure_date' => now()->subDay()->toDateString(),
        'created_at' => now()->subDays(2),
    ]);

    Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'awaiting payment',
        'booking_number' => 'BKG-HIDDEN-PAST-AWAITING',
        'departure_date' => now()->subDay()->toDateString(),
        'created_at' => now()->subDay(),
    ]);

    Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'full payment',
        'booking_number' => 'BKG-HISTORY-PAST-FP',
        'departure_date' => now()->subDay()->toDateString(),
        'created_at' => now(),
    ]);

    Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'cancelled',
        'booking_number' => 'BKG-HISTORY-CANCELLED',
        'departure_date' => now()->addDays(12)->toDateString(),
        'created_at' => now()->addSecond(),
    ]);

    Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'refunded',
        'booking_number' => 'BKG-HISTORY-REFUNDED',
        'departure_date' => now()->addDays(14)->toDateString(),
        'created_at' => now()->addSeconds(2),
    ]);

    $response = $this->actingAs($user)->get('/mybookings?tab=current');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('activeTab', 'current')
        ->has('bookings.data', 4)
        ->where('bookings.data.0.booking_number', 'BKG-CURRENT-FUTURE-FP')
        ->where('bookings.data.1.booking_number', 'BKG-CURRENT-AWAITING')
        ->where('bookings.data.2.booking_number', 'BKG-CURRENT-EXPIRED')
        ->where('bookings.data.3.booking_number', 'BKG-CURRENT-001'));

    $response = $this->actingAs($user)->get('/mybookings?tab=history');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('activeTab', 'history')
        ->has('bookings.data', 3)
        ->where('bookings.data.0.booking_number', 'BKG-HISTORY-REFUNDED')
        ->where('bookings.data.1.booking_number', 'BKG-HISTORY-CANCELLED')
        ->where('bookings.data.2.booking_number', 'BKG-HISTORY-PAST-FP'));
});

test('my bookings deep links to a specific current booking number', function () {
    $user = User::factory()->create(['status' => UserStatus::ACTIVE]);
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);

    Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::WAITING_PAYMENT_APPROVAL,
        'booking_number' => 'BKG-HIGHLIGHT-WPA',
        'departure_date' => now()->addDays(10)->toDateString(),
    ]);

    $response = $this->actingAs($user)->get('/mybookings?tab=current&booking_number=BKG-HIGHLIGHT-WPA');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('activeTab', 'current')
        ->where('selectedBookingNumber', 'BKG-HIGHLIGHT-WPA')
        ->has('bookings.data', 1)
        ->where('bookings.data.0.booking_number', 'BKG-HIGHLIGHT-WPA'));
});

test('my bookings lazily expires stale booking reserved rows before rendering', function () {
    $user = User::factory()->create(['status' => UserStatus::ACTIVE]);
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $vendor->id,
        'departure_date' => now()->addDays(10)->toDateString(),
        'return_date' => now()->addDays(15)->toDateString(),
        'is_active' => true,
    ]);
    TourAvailability::create([
        'company_id' => $vendor->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 20,
        'available' => 18,
    ]);

    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::BOOKING_RESERVED,
        'booking_number' => 'BKG-LAZY-EXPIRED',
        'departure_date' => $schedule->departure_date,
        'reserved_type' => 'system',
        'reserved_expires_at' => now()->subMinute(),
    ]);

    $response = $this->actingAs($user)->get('/mybookings?tab=current');

    $response->assertOk();
    $this->assertDatabaseHas('bookings', [
        'id' => $booking->id,
        'status' => BookingStatus::EXPIRED->value,
        'reserved_expires_at' => null,
    ]);
    $response->assertInertia(fn ($page) => $page
        ->where('activeTab', 'current')
        ->has('bookings.data', 1)
        ->where('bookings.data.0.booking_number', 'BKG-LAZY-EXPIRED')
        ->where('bookings.data.0.status', BookingStatus::EXPIRED->value));
});

test('authenticated users see liked tours in favorites', function () {
    $user = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create([
        'company_id' => $vendor->id,
        'name' => 'Saved Bali Trip',
    ]);

    DB::table('tour_likes')->insert([
        'user_id' => $user->id,
        'tour_id' => $tour->id,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $response = $this->actingAs($user)->get('/mybookings?tab=favorites');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('activeTab', 'favorites')
        ->has('favorites.data', 1)
        ->where('favorites.data.0.name', 'Saved Bali Trip'));
});

test('favorite tours include schedule payload for the schedule modal', function () {
    $user = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create([
        'company_id' => $vendor->id,
        'name' => 'Saved Hong Kong Trip',
        'showprice' => 6500000,
    ]);
    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $vendor->id,
        'departure_date' => now()->addDays(30)->toDateString(),
        'return_date' => now()->addDays(35)->toDateString(),
        'is_active' => true,
    ]);
    TourAvailability::create([
        'company_id' => $vendor->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 20,
        'available' => 12,
    ]);

    DB::table('tour_likes')->insert([
        'user_id' => $user->id,
        'tour_id' => $tour->id,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $response = $this->actingAs($user)->get('/mybookings?tab=favorites');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('activeTab', 'favorites')
        ->has('favorites.data', 1)
        ->where('favorites.data.0.id', $tour->id)
        ->where('favorites.data.0.schedules.0.departure_date', $schedule->departure_date)
        ->where('favorites.data.0.schedules.0.price', 6500000)
        ->where('favorites.data.0.schedules.0.availability.available', 12));
});

test('authenticated users can toggle a tour like', function () {
    $user = User::factory()->create(['status' => UserStatus::ACTIVE]);
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);

    $this->actingAs($user)
        ->post("/me/tours/{$tour->id}/like")
        ->assertOk()
        ->assertJson(['liked' => true]);

    $this->assertDatabaseHas('tour_likes', [
        'user_id' => $user->id,
        'tour_id' => $tour->id,
    ]);

    $this->actingAs($user)
        ->post("/me/tours/{$tour->id}/like")
        ->assertOk()
        ->assertJson(['liked' => false]);

    $this->assertDatabaseMissing('tour_likes', [
        'user_id' => $user->id,
        'tour_id' => $tour->id,
    ]);
});
