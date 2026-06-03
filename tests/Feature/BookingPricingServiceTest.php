<?php

use App\Enums\BookingStatus;
use App\Models\AppConfig;
use App\Models\Booking;
use App\Models\Company;
use App\Models\PriceCategory;
use App\Models\Tour;
use App\Models\TourAddOn;
use App\Models\TourAvailability;
use App\Models\TourPrice;
use App\Models\TourSchedule;
use App\Services\BookingPricingService;
use Database\Seeders\Common\RolePermissionSeeder;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);

    DB::table('continents')->insertOrIgnore(['id' => 1, 'name' => 'Asia']);
    DB::table('regions')->insertOrIgnore(['id' => 1, 'name' => 'Southeast Asia', 'continent_id' => 1]);
    DB::table('countries')->insertOrIgnore(['id' => 1, 'name' => 'Indonesia', 'continent_id' => 1, 'region_id' => 1]);

    AppConfig::updateOrCreate(['key' => 'admin'], [
        'description' => 'Admin Parameter configuration',
        'value' => [
            'platform_fee' => '30000',
            'commission_min' => '50000',
            'commission_mid' => '75000',
            'commission_max' => '100000',
        ],
    ]);
});

function createPricingScenario(): array
{
    $vendor = Company::factory()->create([
        'username' => 'pricingvendor',
        'type' => 'vendor',
    ]);
    $vendor->companySetting()->updateOrCreate([], [
        'minimum_vat' => 11,
    ]);

    $tour = Tour::factory()->create([
        'company_id' => $vendor->id,
        'code' => 'PRICE-TOUR',
        'status' => 'active',
    ]);
    $schedule = TourSchedule::create([
        'company_id' => $vendor->id,
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'departure_date' => now()->addMonth()->toDateString(),
        'return_date' => now()->addMonth()->addDays(5)->toDateString(),
        'is_active' => true,
    ]);
    TourAvailability::create([
        'company_id' => $vendor->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'max_pax' => 10,
        'available' => 10,
    ]);

    $adultSingle = PriceCategory::create([
        'company_id' => $vendor->id,
        'name' => 'Adult Single',
        'room_type' => 'single',
    ]);
    $childWithBed = PriceCategory::create([
        'company_id' => $vendor->id,
        'name' => 'Child With Bed',
        'room_type' => 'child_with_bed',
    ]);
    $adultSuite = PriceCategory::create([
        'company_id' => $vendor->id,
        'name' => 'Adult Suite',
        'room_type' => 'suite',
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
        'price_category_id' => $adultSingle->id,
        'currency' => 'IDR',
        'price' => 12_000_000,
        'commission' => 1_000_000,
        'commission_rate' => 0,
    ]);
    TourPrice::create([
        'company_id' => $vendor->id,
        'tour_code' => $tour->code,
        'schedule_id' => $schedule->id,
        'price_category_id' => $childWithBed->id,
        'currency' => 'IDR',
        'price' => 9_000_000,
        'commission' => 0,
        'commission_rate' => 10,
    ]);
    TourPrice::create([
        'company_id' => $vendor->id,
        'tour_code' => $tour->code,
        'schedule_id' => $schedule->id,
        'price_category_id' => $adultSuite->id,
        'currency' => 'IDR',
        'price' => 21_000_000,
        'promotion' => 1_000_000,
        'commission' => 0,
        'commission_rate' => 5,
    ]);
    TourPrice::create([
        'company_id' => $vendor->id,
        'tour_code' => $tour->code,
        'schedule_id' => $schedule->id,
        'price_category_id' => $infant->id,
        'currency' => 'IDR',
        'price' => 0,
        'commission' => 0,
        'commission_rate' => 0,
    ]);

    $addOn = TourAddOn::create([
        'company_id' => $vendor->id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'description' => 'Airport transfer',
        'price' => 500_000,
        'edit_status' => false,
    ]);

    return compact('vendor', 'tour', 'schedule', 'addOn');
}

test('booking pricing service calculates server authoritative totals and commissions', function () {
    ['tour' => $tour, 'schedule' => $schedule, 'addOn' => $addOn] = createPricingScenario();

    $quote = app(BookingPricingService::class)->quoteForBookingData($tour, $schedule->departure_date, [
        ['first_name' => 'Adult', 'price_category' => 'Adult Single', 'price_amount' => 1],
        ['first_name' => 'Child', 'price_category' => 'Child With Bed', 'price_amount' => 1],
        ['first_name' => 'Suite', 'price_category' => 'Adult Suite', 'price_amount' => 1],
        ['first_name' => 'Infant', 'price_category' => 'Infant', 'price_amount' => 1],
    ], [
        ['name' => 'Airport transfer', 'price' => $addOn->price],
    ]);

    expect($quote['subtotal_guests'])->toBe(42_000_000.0)
        ->and($quote['discounted_subtotal'])->toBe(41_000_000.0)
        ->and($quote['promotion_discount'])->toBe(1_000_000.0)
        ->and($quote['platform_fee'])->toBe(120_000.0)
        ->and($quote['tax_amount'])->toBe(4_510_000.0)
        ->and($quote['addons_total'])->toBe(500_000.0)
        ->and($quote['agent_commission'])->toBe(2_900_000.0)
        ->and($quote['travelboost_commission'])->toBe(200_000.0)
        ->and($quote['grand_total'])->toBe(46_130_000.0);

    expect($quote['passengers'][0]['price_amount'])->toBe(12_000_000.0)
        ->and($quote['passengers'][1]['price_amount'])->toBe(9_000_000.0)
        ->and($quote['passengers'][2]['price_amount'])->toBe(20_000_000.0)
        ->and($quote['passengers'][3]['price_amount'])->toBe(0.0);
});

test('booking pricing service multiplies matched addon unit price by submitted quantity', function () {
    ['tour' => $tour, 'schedule' => $schedule, 'addOn' => $addOn] = createPricingScenario();

    $quote = app(BookingPricingService::class)->quoteForBookingData($tour, $schedule->departure_date, [
        ['first_name' => 'Adult', 'price_category' => 'Adult Single', 'price_amount' => 1],
    ], [
        ['name' => 'Airport transfer', 'price' => $addOn->price * 2, 'qty' => 2],
    ]);

    expect($quote['addons_total'])->toBe(1_000_000.0)
        ->and($quote['addons'][0]['price'])->toBe(1_000_000.0);
});

test('booking snapshot quote includes persisted add ons without double counting stale grand total', function () {
    ['tour' => $tour, 'schedule' => $schedule, 'addOn' => $addOn] = createPricingScenario();

    $quote = app(BookingPricingService::class)->quoteForBookingData($tour, $schedule->departure_date, [
        ['first_name' => 'Adult', 'price_category' => 'Adult Single', 'price_amount' => 1],
        ['first_name' => 'Child', 'price_category' => 'Child With Bed', 'price_amount' => 1],
    ], [
        ['name' => 'Airport transfer', 'price' => $addOn->price],
    ]);

    $booking = Booking::factory()->create([
        'vendor_id' => $tour->company_id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'status' => BookingStatus::BOOKING_RESERVED,
        'pax_adult' => 1,
        'pax_child' => 1,
        'pax_infant' => 0,
        'total_price' => $quote['subtotal_guests'],
        'tax_amount' => $quote['tax_amount'],
        'platform_fee' => $quote['platform_fee'],
        'commission_amount' => $quote['agent_commission'],
        'grand_total' => $quote['grand_total'] - $quote['addons_total'],
    ]);
    $booking->passengers()->createMany($quote['passengers']);
    $booking->addons()->createMany($quote['addons']);

    $staleSnapshotQuote = app(BookingPricingService::class)->quoteForBooking($booking->fresh());

    expect($staleSnapshotQuote['addons_total'])->toBe($quote['addons_total'])
        ->and($staleSnapshotQuote['grand_total'])->toBe($quote['grand_total']);

    $booking->update(['grand_total' => $quote['grand_total']]);

    $currentSnapshotQuote = app(BookingPricingService::class)->quoteForBooking($booking->fresh());

    expect($currentSnapshotQuote['addons_total'])->toBe($quote['addons_total'])
        ->and($currentSnapshotQuote['grand_total'])->toBe($quote['grand_total']);
});

test('booking pricing service calculates travelboost commission from admin tier parameters', function () {
    ['tour' => $tour, 'schedule' => $schedule] = createPricingScenario();

    AppConfig::updateOrCreate(['key' => 'admin'], [
        'description' => 'Admin Parameter configuration',
        'value' => [
            'platform_fee' => '30000',
            'commission_min' => '40000',
            'commission_mid' => '60000',
            'commission_max' => '90000',
        ],
    ]);

    $quote = app(BookingPricingService::class)->quoteForBookingData($tour, $schedule->departure_date, [
        ['first_name' => 'Low', 'price_category' => 'Custom Low', 'price_amount' => 9_000_000],
        ['first_name' => 'Boundary', 'price_category' => 'Custom Boundary', 'price_amount' => 10_000_000],
        ['first_name' => 'Mid', 'price_category' => 'Custom Mid', 'price_amount' => 20_000_000],
        ['first_name' => 'High', 'price_category' => 'Custom High', 'price_amount' => 21_000_000],
        ['first_name' => 'Free', 'price_category' => 'Custom Free', 'price_amount' => 0],
    ]);

    expect($quote['platform_fee'])->toBe(150_000.0)
        ->and($quote['platform_fee_per_pax'])->toBe(30_000.0)
        ->and($quote['travelboost_commission'])->toBe(250_000.0)
        ->and($quote['travelboost_commission_breakdown'])->toHaveCount(4);
});

test('booking pricing service reads admin platform fee fallback', function () {
    ['tour' => $tour, 'schedule' => $schedule] = createPricingScenario();

    AppConfig::where('key', 'admin')->delete();

    $quote = app(BookingPricingService::class)->quoteForBookingData($tour, $schedule->departure_date, [
        ['first_name' => 'Adult', 'price_category' => 'Adult Single'],
    ]);

    expect($quote['platform_fee'])->toBe(25_000.0)
        ->and($quote['platform_fee_per_pax'])->toBe(25_000.0)
        ->and($quote['travelboost_commission'])->toBe(75_000.0);
});
