<?php

use App\Models\AgentTour;
use App\Models\Company;
use App\Models\Domain;
use App\Models\PriceCategory;
use App\Models\Tour;
use App\Models\TourAvailability;
use App\Models\TourPrice;
use App\Models\TourSchedule;
use App\Models\User;
use Database\Seeders\Common\RolePermissionSeeder;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);

    DB::table('continents')->insertOrIgnore(['id' => 1, 'name' => 'Asia']);
    DB::table('regions')->insertOrIgnore(['id' => 1, 'name' => 'Southeast Asia', 'continent_id' => 1]);
    DB::table('countries')->insertOrIgnore(['id' => 1, 'name' => 'Indonesia', 'continent_id' => 1, 'region_id' => 1]);
});

test('agent subdomain catalog exposes schedule price from minimum active price category', function () {
    $agent = Company::factory()->create([
        'type' => 'agent',
        'username' => 'catalogagent',
    ]);
    $vendor = Company::factory()->create([
        'type' => 'vendor',
    ]);
    $vendor->companySetting()->updateOrCreate([], [
        'booking_deadline' => 0,
    ]);

    Domain::create([
        'subdomain' => $agent->username,
        'owner_type' => Company::class,
        'owner_id' => $agent->id,
        'subdomain_enabled' => true,
    ]);

    $tour = Tour::factory()->create([
        'company_id' => $vendor->id,
        'status' => 'active',
        'showprice' => 9_999_999,
    ]);

    AgentTour::create([
        'company_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => 'active',
    ]);

    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $vendor->id,
        'departure_date' => now()->addDays(30)->toDateString(),
        'return_date' => now()->addDays(34)->toDateString(),
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
    $childNoBed = PriceCategory::create([
        'company_id' => $vendor->id,
        'name' => 'Child No Bed',
        'room_type' => 'no_bed',
    ]);
    $infant = PriceCategory::create([
        'company_id' => $vendor->id,
        'name' => 'Infant',
        'room_type' => 'infant',
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
    TourPrice::create([
        'company_id' => $vendor->id,
        'tour_code' => $tour->code,
        'schedule_id' => $schedule->id,
        'price_category_id' => $childNoBed->id,
        'currency' => 'IDR',
        'price' => 3_000_000,
    ]);
    TourPrice::create([
        'company_id' => $vendor->id,
        'tour_code' => $tour->code,
        'schedule_id' => $schedule->id,
        'price_category_id' => $infant->id,
        'currency' => 'IDR',
        'price' => 0,
    ]);

    $appHost = env('APP_HOST', 'localhost');

    $response = $this->get("http://{$agent->username}.{$appHost}/tours");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('companies/agent-tours')
        ->where('data.0.tour.schedules.0.price', 3_000_000));
});

test('agent subdomain catalog marks liked tours for authenticated customers', function () {
    $agent = Company::factory()->create([
        'type' => 'agent',
        'username' => 'likedcatalog',
    ]);
    $vendor = Company::factory()->create([
        'type' => 'vendor',
    ]);
    $vendor->companySetting()->updateOrCreate([], [
        'booking_deadline' => 0,
    ]);

    Domain::create([
        'subdomain' => $agent->username,
        'owner_type' => Company::class,
        'owner_id' => $agent->id,
        'subdomain_enabled' => true,
    ]);

    $likedTour = Tour::factory()->create([
        'company_id' => $vendor->id,
        'status' => 'active',
    ]);
    $otherTour = Tour::factory()->create([
        'company_id' => $vendor->id,
        'status' => 'active',
    ]);

    foreach ([$likedTour, $otherTour] as $tour) {
        AgentTour::create([
            'company_id' => $agent->id,
            'tour_id' => $tour->id,
            'status' => 'active',
        ]);

        $schedule = TourSchedule::create([
            'tour_id' => $tour->id,
            'tour_code' => $tour->code,
            'company_id' => $vendor->id,
            'departure_date' => now()->addDays(30)->toDateString(),
            'return_date' => now()->addDays(34)->toDateString(),
            'is_active' => true,
        ]);

        TourAvailability::create([
            'company_id' => $vendor->id,
            'tour_id' => $tour->id,
            'schedule_id' => $schedule->id,
            'max_pax' => 10,
            'available' => 10,
        ]);
    }

    $customer = User::factory()->create();

    DB::table('tour_likes')->insert([
        'user_id' => $customer->id,
        'tour_id' => $likedTour->id,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $appHost = env('APP_HOST', 'localhost');

    $response = $this->actingAs($customer)
        ->get("http://{$agent->username}.{$appHost}/tours");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('companies/agent-tours')
        ->has('data', 2)
        ->where('data', function ($data) use ($likedTour, $otherTour): bool {
            $byTourId = collect($data)->keyBy(fn (array $item): int => (int) $item['tour']['id']);

            return ($byTourId[$likedTour->id]['tour']['is_liked'] ?? null) === true
                && ($byTourId[$otherTour->id]['tour']['is_liked'] ?? null) === false;
        }));
});

test('customer can open booking create wizard from agent subdomain schedule', function () {
    $agent = Company::factory()->create([
        'type' => 'agent',
        'username' => 'bookingagent',
    ]);
    $vendor = Company::factory()->create([
        'type' => 'vendor',
    ]);
    $vendor->companySetting()->updateOrCreate([], [
        'booking_deadline' => 0,
        'booking_entry_time_limit' => 20,
        'minimum_down_payment' => 30,
    ]);

    Domain::create([
        'subdomain' => $agent->username,
        'owner_type' => Company::class,
        'owner_id' => $agent->id,
        'subdomain_enabled' => true,
    ]);

    $tour = Tour::factory()->create([
        'company_id' => $vendor->id,
        'status' => 'active',
    ]);

    AgentTour::create([
        'company_id' => $agent->id,
        'tour_id' => $tour->id,
        'status' => 'active',
    ]);

    $schedule = TourSchedule::create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $vendor->id,
        'departure_date' => now()->addDays(30)->toDateString(),
        'return_date' => now()->addDays(34)->toDateString(),
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
        'commission' => 500_000,
    ]);

    $customer = User::factory()->create();
    $appHost = env('APP_HOST', 'localhost');

    $response = $this->actingAs($customer)
        ->get("http://{$agent->username}.{$appHost}/bookings/{$tour->id}/create?date={$schedule->departure_date}");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tours/bookings/create')
        ->where('tenant.id', $agent->id)
        ->where('vendor.id', $vendor->id)
        ->where('tourPrices.0.commission', 500_000));
});
