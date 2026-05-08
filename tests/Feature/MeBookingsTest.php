<?php

use App\Enums\UserStatus;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Booking;
use App\Models\Company;
use App\Models\Tour;
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

test('authenticated users see current bookings filtered from history statuses', function () {
    $user = User::factory()->create(['status' => UserStatus::ACTIVE]);
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);

    Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'reserved',
        'booking_number' => 'BKG-CURRENT-001',
    ]);

    Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'expired',
        'booking_number' => 'BKG-HISTORY-001',
    ]);

    $response = $this->actingAs($user)->get('/mybookings?tab=current');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('activeTab', 'current')
        ->has('bookings.data', 1)
        ->where('bookings.data.0.booking_number', 'BKG-CURRENT-001'));
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
