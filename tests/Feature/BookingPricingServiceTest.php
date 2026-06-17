<?php

use App\Actions\Booking\FinalizeBookingPaymentAction;
use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\AgentTier;
use App\Models\AppConfig;
use App\Models\Booking;
use App\Models\Company;
use App\Models\Payment;
use App\Models\PriceCategory;
use App\Models\ProductCommissionCategory;
use App\Models\Tour;
use App\Models\TourAddOn;
use App\Models\TourAvailability;
use App\Models\TourCommissionAdditionalRule;
use App\Models\TourCommissionRule;
use App\Models\TourCommissionRuleScheduleAdjustment;
use App\Models\TourPrice;
use App\Models\TourSchedule;
use App\Models\User;
use App\Models\VendorAgentPartner;
use App\Models\VisaCategory;
use App\Models\VisaCategoryItem;
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
            'commission_max' => '75000',
        ],
    ]);

    $rootUser = User::factory()->create([
        'username' => 'root',
        'email' => 'root@travelboost.co.id',
    ]);
    $rootUser->wallet()->create(['balance' => 0, 'name' => 'Root Wallet']);
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

test('booking pricing service includes only taxable add ons in vat base', function () {
    ['tour' => $tour, 'schedule' => $schedule] = createPricingScenario();

    TourAddOn::create([
        'company_id' => $tour->company_id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'description' => 'Taxable visa',
        'price' => 1_000_000,
        'edit_status' => false,
        'is_taxable' => true,
    ]);
    TourAddOn::create([
        'company_id' => $tour->company_id,
        'tour_id' => $tour->id,
        'schedule_id' => $schedule->id,
        'description' => 'Non taxable insurance',
        'price' => 500_000,
        'edit_status' => false,
        'is_taxable' => false,
    ]);

    $quote = app(BookingPricingService::class)->quoteForBookingData($tour, $schedule->departure_date, [
        ['first_name' => 'Adult', 'price_category' => 'Adult Single', 'price_amount' => 1],
    ], [
        ['name' => 'Taxable visa', 'qty' => 2],
        ['name' => 'Non taxable insurance', 'qty' => 1],
    ]);

    expect($quote['addons_total'])->toBe(2_500_000.0)
        ->and($quote['taxable_addons_total'])->toBe(2_000_000.0)
        ->and($quote['tax_amount'])->toBe(1_540_000.0)
        ->and($quote['grand_total'])->toBe(16_070_000.0)
        ->and($quote['addons'][0]['is_taxable'])->toBeTrue()
        ->and($quote['addons'][1]['is_taxable'])->toBeFalse();
});

test('booking pricing service snapshots passenger visa selections and includes taxable visa in vat base', function () {
    ['tour' => $tour, 'schedule' => $schedule] = createPricingScenario();

    $visaCategory = VisaCategory::create([
        'company_id' => $tour->company_id,
        'name' => 'Visa Group A',
        'slug' => 'visa-group-a',
    ]);
    $taxableVisa = VisaCategoryItem::create([
        'visa_category_id' => $visaCategory->id,
        'description' => 'Taxable China Visa',
        'price' => 1_000_000,
        'is_taxable' => true,
    ]);
    $nonTaxableVisa = VisaCategoryItem::create([
        'visa_category_id' => $visaCategory->id,
        'description' => 'Non Taxable Visa Service',
        'price' => 500_000,
        'is_taxable' => false,
    ]);
    $tour->forceFill(['visa_category_id' => $visaCategory->id])->save();

    $quote = app(BookingPricingService::class)->quoteForBookingData($tour, $schedule->departure_date, [
        ['first_name' => 'Adult One', 'price_category' => 'Adult Single', 'visa_category_item_id' => $taxableVisa->id],
        ['first_name' => 'Adult Two', 'price_category' => 'Adult Single', 'visa_category_item_id' => $nonTaxableVisa->id],
    ]);

    expect($quote['visa_total'])->toBe(1_500_000.0)
        ->and($quote['taxable_visa_total'])->toBe(1_000_000.0)
        ->and($quote['tax_amount'])->toBe(2_750_000.0)
        ->and($quote['grand_total'])->toBe(28_310_000.0)
        ->and($quote['passengers'][0]['visa_category_item_id'])->toBe($taxableVisa->id)
        ->and($quote['passengers'][0]['visa_type_description'])->toBe('Taxable China Visa')
        ->and($quote['passengers'][0]['visa_type_price'])->toBe(1_000_000.0)
        ->and($quote['passengers'][0]['visa_type_is_taxable'])->toBeTrue()
        ->and($quote['passengers'][1]['visa_category_item_id'])->toBe($nonTaxableVisa->id)
        ->and($quote['passengers'][1]['visa_type_description'])->toBe('Non Taxable Visa Service')
        ->and($quote['passengers'][1]['visa_type_price'])->toBe(500_000.0)
        ->and($quote['passengers'][1]['visa_type_is_taxable'])->toBeFalse();

    $booking = Booking::factory()->create([
        'vendor_id' => $tour->company_id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'status' => BookingStatus::BOOKING_RESERVED,
        'pax_adult' => 2,
        'pax_child' => 0,
        'pax_infant' => 0,
        'total_price' => $quote['subtotal_guests'],
        'tax_rate' => $quote['tax_rate'],
        'tax_amount' => $quote['tax_amount'],
        'platform_fee' => $quote['platform_fee'],
        'commission_amount' => $quote['agent_commission'],
        'grand_total' => $quote['grand_total'],
    ]);
    $booking->passengers()->createMany($quote['passengers']);

    $taxableVisa->update([
        'description' => 'Updated Master Visa',
        'price' => 9_000_000,
        'is_taxable' => false,
    ]);

    $snapshotQuote = app(BookingPricingService::class)->quoteForBooking($booking->fresh());

    expect($snapshotQuote['visa_total'])->toBe(1_500_000.0)
        ->and($snapshotQuote['taxable_visa_total'])->toBe(1_000_000.0)
        ->and($snapshotQuote['tax_amount'])->toBe(2_750_000.0)
        ->and($snapshotQuote['grand_total'])->toBe(28_310_000.0)
        ->and($snapshotQuote['passengers'][0]['visa_type_description'])->toBe('Taxable China Visa')
        ->and((float) $snapshotQuote['passengers'][0]['visa_type_price'])->toBe(1_000_000.0)
        ->and((bool) $snapshotQuote['passengers'][0]['visa_type_is_taxable'])->toBeTrue();
});

test('booking pricing service resolves agent commission from tier matrix and schedule rules', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule] = createPricingScenario();
    $agent = Company::factory()->create(['type' => 'agent']);
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

    $tour->forceFill(['product_commission_category_id' => $category->id])->save();
    VendorAgentPartner::create([
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'agent_tier_id' => $tier->id,
        'status' => 'active',
    ]);

    $rule = TourCommissionRule::create([
        'company_id' => $vendor->id,
        'tour_id' => null,
        'agent_tier_id' => $tier->id,
        'product_commission_category_id' => $category->id,
        'commission_type' => 'percent',
        'commission_value' => 10,
        'is_active' => true,
    ]);
    TourCommissionRuleScheduleAdjustment::create([
        'tour_commission_rule_id' => $rule->id,
        'tour_schedule_id' => $schedule->id,
        'commission_type' => 'fixed',
        'commission_value' => 250_000,
    ]);
    TourCommissionAdditionalRule::create([
        'company_id' => $vendor->id,
        'agent_tier_id' => $tier->id,
        'product_commission_category_id' => $category->id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'scope_type' => 'category_departure',
        'commission_type' => 'percent',
        'commission_value' => 5,
        'is_active' => true,
    ]);

    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'agent_id' => $agent->id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'total_price' => 10_000_000,
        'tax_amount' => 1_100_000,
        'platform_fee' => 30_000,
        'commission_amount' => 0,
        'grand_total' => 11_130_000,
    ]);
    $booking->passengers()->create([
        'first_name' => 'Matrix',
        'last_name' => 'Guest',
        'price_category' => 'Adult Single',
        'price_amount' => 10_000_000,
    ]);

    $quote = app(BookingPricingService::class)->quoteForBooking($booking);

    expect($quote['agent_commission'])->toBe(1_750_000.0)
        ->and($quote['agent_commission_breakdown']['source'])->toBe('commission_matrix')
        ->and($quote['agent_commission_breakdown']['base_rule_amount'])->toBe(1_000_000.0)
        ->and($quote['agent_commission_breakdown']['schedule_adjustment_amount'])->toBe(250_000.0)
        ->and($quote['agent_commission_breakdown']['additional_rule_amount'])->toBe(500_000.0);
});

test('booking pricing fallback commission prioritizes tour price rate before fixed amount', function () {
    ['tour' => $tour, 'schedule' => $schedule] = createPricingScenario();
    $agent = Company::factory()->create([
        'type' => 'agent',
    ]);

    TourPrice::query()
        ->where('tour_code', $tour->code)
        ->where('schedule_id', $schedule->id)
        ->whereRelation('priceCategory', 'name', 'Adult Single')
        ->update([
            'commission' => 1_000_000,
            'commission_rate' => 12,
        ]);

    $quote = app(BookingPricingService::class)->quoteForBookingData(
        $tour,
        $schedule->departure_date,
        [
            ['first_name' => 'Fallback', 'price_category' => 'Adult Single', 'price_amount' => 1],
        ],
        [],
        null,
        true,
        $agent->id,
    );

    expect($quote['agent_commission'])->toBe(1_440_000.0)
        ->and(data_get($quote, 'agent_commission_breakdown.0.breakdown.source'))->toBe('tour_price_percent');
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
        'tax_rate' => $quote['tax_rate'],
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

test('booking snapshot quote recalculates vat from persisted taxable add ons', function () {
    ['tour' => $tour, 'schedule' => $schedule, 'addOn' => $addOn] = createPricingScenario();

    $addOn->forceFill(['is_taxable' => true])->save();

    $quote = app(BookingPricingService::class)->quoteForBookingData($tour, $schedule->departure_date, [
        ['first_name' => 'Adult', 'price_category' => 'Adult Single', 'price_amount' => 1],
    ], [
        ['name' => 'Airport transfer', 'qty' => 1],
    ]);

    $booking = Booking::factory()->create([
        'vendor_id' => $tour->company_id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'status' => BookingStatus::BOOKING_RESERVED,
        'pax_adult' => 1,
        'pax_child' => 0,
        'pax_infant' => 0,
        'total_price' => $quote['subtotal_guests'],
        'tax_rate' => $quote['tax_rate'],
        'tax_amount' => 1_320_000,
        'platform_fee' => $quote['platform_fee'],
        'commission_amount' => $quote['agent_commission'],
        'grand_total' => 13_850_000,
    ]);
    $booking->passengers()->createMany($quote['passengers']);
    $booking->addons()->createMany($quote['addons']);

    $snapshotQuote = app(BookingPricingService::class)->quoteForBooking($booking->fresh());

    expect($snapshotQuote['taxable_addons_total'])->toBe(500_000.0)
        ->and($snapshotQuote['tax_amount'])->toBe(1_375_000.0)
        ->and($snapshotQuote['grand_total'])->toBe(13_905_000.0);
});

test('booking snapshot quote and finalization keep zero tax rate after vendor vat changes', function () {
    ['vendor' => $vendor, 'tour' => $tour, 'schedule' => $schedule] = createPricingScenario();
    $vendor->companySetting()->update(['minimum_vat' => 0]);
    $vendor->depositFloat(5000000);
    $tour = $tour->fresh(['company.companySetting']);

    $quote = app(BookingPricingService::class)->quoteForBookingData($tour, $schedule->departure_date, [
        ['first_name' => 'Adult', 'price_category' => 'Adult Single', 'price_amount' => 1],
    ]);

    $booking = Booking::factory()->create([
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'departure_date' => $schedule->departure_date,
        'status' => BookingStatus::BOOKING_RESERVED,
        'pax_adult' => 1,
        'pax_child' => 0,
        'pax_infant' => 0,
        'total_price' => $quote['subtotal_guests'],
        'tax_rate' => $quote['tax_rate'],
        'tax_amount' => $quote['tax_amount'],
        'platform_fee' => $quote['platform_fee'],
        'commission_amount' => $quote['agent_commission'],
        'grand_total' => $quote['grand_total'],
    ]);
    $booking->passengers()->createMany($quote['passengers']);

    $vendor->companySetting()->update(['minimum_vat' => 20]);

    $snapshotQuote = app(BookingPricingService::class)->quoteForBooking($booking->fresh());

    expect($snapshotQuote['tax_rate'])->toBe(0.0)
        ->and($snapshotQuote['tax_amount'])->toBe($quote['tax_amount'])
        ->and($snapshotQuote['grand_total'])->toBe($quote['grand_total']);

    $payment = Payment::create([
        'owner_type' => Company::class,
        'owner_id' => $vendor->id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'midtrans',
        'payment_method' => 'bank_transfer',
        'amount' => $quote['grand_total'],
        'status' => PaymentStatus::PAID,
        'payload' => [
            'booking_payment_type' => 'full_payment',
            'payment_type' => 'full_payment',
            'counts_toward_booking_total' => true,
        ],
        'paid_at' => now(),
    ]);

    app(FinalizeBookingPaymentAction::class)->execute($booking->fresh(), $payment, notify: false);

    $booking->refresh();

    expect($booking->status)->toBe(BookingStatus::FULL_PAYMENT)
        ->and((float) $booking->tax_rate)->toBe(0.0)
        ->and((float) $booking->tax_amount)->toBe($quote['tax_amount'])
        ->and((float) $booking->grand_total)->toBe($quote['grand_total']);
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

test('booking pricing service defaults high travelboost commission tier to seventy five thousand', function () {
    ['tour' => $tour, 'schedule' => $schedule] = createPricingScenario();

    AppConfig::where('key', 'admin')->delete();

    $quote = app(BookingPricingService::class)->quoteForBookingData($tour, $schedule->departure_date, [
        ['first_name' => 'High', 'price_category' => 'Custom High', 'price_amount' => 21_000_000],
    ]);

    expect($quote['travelboost_commission'])->toBe(75_000.0);
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
