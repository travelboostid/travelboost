<?php

namespace App\Services;

use App\Models\AppConfig;
use App\Models\Booking;
use App\Models\Company;
use App\Models\Tour;
use App\Models\TourAddOn;
use App\Models\TourPrice;
use App\Models\TourSchedule;
use App\Models\VisaCategoryItem;
use DateTimeInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class BookingPricingService
{
    public const DEFAULT_PLATFORM_FEE_PER_PAX = 25_000;

    public const DEFAULT_TRAVELBOOST_COMMISSION_MIN = 50_000;

    public const DEFAULT_TRAVELBOOST_COMMISSION_MID = 75_000;

    public const DEFAULT_TRAVELBOOST_COMMISSION_MAX = 75_000;

    public const DEFAULT_PPN_RATE = 11;

    /**
     * @param  array<int, array<string, mixed>>  $guests
     * @return array{subtotalGuests: float, paxCount: int, platformFee: float, ppn: float, agentCommission: float, totalPrice: float, totalPayment: float}
     */
    public function calculate(array $guests, Company $vendor): array
    {
        $subtotalGuests = (float) collect($guests)->sum('price_amount');
        $paxCount = count($guests);
        $platformFee = $paxCount * $this->platformFeePerPax();
        $ppnRate = (float) ($vendor->companySetting?->minimum_vat ?? self::DEFAULT_PPN_RATE);
        $ppn = (float) round($subtotalGuests * ($ppnRate / 100));
        $agentCommission = (float) ($vendor->commission ?? 0);
        $totalPrice = $subtotalGuests + $platformFee + $ppn;

        return [
            'subtotalGuests' => $subtotalGuests,
            'paxCount' => $paxCount,
            'platformFee' => $platformFee,
            'ppn' => $ppn,
            'agentCommission' => $agentCommission,
            'totalPrice' => $totalPrice,
            'totalPayment' => $totalPrice,
        ];
    }

    public function platformFeePerPax(): float
    {
        $value = data_get($this->adminConfig(), 'platform_fee');

        return $this->numericConfigValue($value, self::DEFAULT_PLATFORM_FEE_PER_PAX);
    }

    /**
     * @param  array<int, array<string, mixed>>  $passengers
     * @param  array<int, array<string, mixed>>  $addons
     * @return array<string, mixed>
     */
    public function quoteForBookingData(
        Tour $tour,
        string|DateTimeInterface $departureDate,
        array $passengers,
        array $addons = [],
        ?float $vatPct = null,
        bool $includeAgentCommission = true,
        ?int $agentId = null,
    ): array {
        $tour->loadMissing('company.companySetting');

        $date = $this->normalizeDate($departureDate);
        $schedule = $this->resolveSchedule($tour, $date);
        $tourPrices = $this->tourPricesByCategory($tour, $schedule);
        $paxCount = count($passengers);
        $platformFee = $paxCount * $this->platformFeePerPax();
        $vatRate = $vatPct ?? (float) ($tour->company?->companySetting?->minimum_vat ?? self::DEFAULT_PPN_RATE);

        $subtotalGuests = 0.0;
        $discountedSubtotal = 0.0;
        $agentCommission = 0.0;
        $travelboostCommission = 0.0;
        $visaTotal = 0.0;
        $taxableVisaTotal = 0.0;
        $agentBreakdown = [];
        $travelboostBreakdown = [];
        $visaItemsById = $this->visaItemsById($tour);

        $quotedPassengers = collect($passengers)
            ->map(function (array $passenger, int $index) use ($tour, $schedule, $tourPrices, $visaItemsById, $includeAgentCommission, $agentId, &$subtotalGuests, &$discountedSubtotal, &$agentCommission, &$travelboostCommission, &$visaTotal, &$taxableVisaTotal, &$agentBreakdown, &$travelboostBreakdown): array {
                $categoryName = trim((string) data_get($passenger, 'price_category', ''));
                $tourPrice = $this->matchTourPrice($tourPrices, $categoryName);
                $originalPrice = $tourPrice ? (float) $tourPrice->price : (float) data_get($passenger, 'price_amount', 0);
                $discountedPrice = $tourPrice ? $this->discountedPrice($tourPrice) : $originalPrice;
                $visaSnapshot = $this->passengerVisaSnapshot($passenger, $visaItemsById);
                $agentCommissionResolution = $tourPrice && $includeAgentCommission
                    ? app(AgentCommissionResolver::class)->resolve($tour, $schedule, $tourPrice, $discountedPrice, $agentId)
                    : ['amount' => 0.0, 'breakdown' => ['source' => 'not_applicable']];
                $passengerAgentCommission = (float) $agentCommissionResolution['amount'];
                $passengerTravelboostCommission = $this->travelboostCommissionForPassengerPrice($discountedPrice);

                $subtotalGuests += $originalPrice;
                $discountedSubtotal += $discountedPrice;
                $agentCommission += $passengerAgentCommission;
                $travelboostCommission += $passengerTravelboostCommission;
                $visaTotal += (float) $visaSnapshot['visa_type_price'];

                if ((bool) $visaSnapshot['visa_type_is_taxable']) {
                    $taxableVisaTotal += (float) $visaSnapshot['visa_type_price'];
                }

                if ($passengerAgentCommission > 0) {
                    $agentBreakdown[] = [
                        'passenger_index' => $index,
                        'price_category' => $categoryName,
                        'price_amount' => $discountedPrice,
                        'commission_amount' => $passengerAgentCommission,
                        'breakdown' => $agentCommissionResolution['breakdown'],
                    ];
                }

                if ($passengerTravelboostCommission > 0) {
                    $travelboostBreakdown[] = [
                        'passenger_index' => $index,
                        'price_category' => $categoryName,
                        'price_amount' => $discountedPrice,
                        'commission_amount' => $passengerTravelboostCommission,
                    ];
                }

                $passenger['price_amount'] = $discountedPrice;
                $passenger['visa_category_item_id'] = $visaSnapshot['visa_category_item_id'];
                $passenger['visa_type_description'] = $visaSnapshot['visa_type_description'];
                $passenger['visa_type_price'] = $visaSnapshot['visa_type_price'];
                $passenger['visa_type_is_taxable'] = $visaSnapshot['visa_type_is_taxable'];

                return $passenger;
            })
            ->values()
            ->all();

        $quotedAddons = $this->quoteAddons($tour, $schedule, $addons);
        $addonsTotal = (float) collect($quotedAddons)->sum('price');
        $taxableAddonsTotal = (float) collect($quotedAddons)
            ->filter(fn (array $addon): bool => (bool) ($addon['is_taxable'] ?? false))
            ->sum('price');
        $promotionDiscount = max(0.0, $subtotalGuests - $discountedSubtotal);
        $taxAmount = (float) round(($discountedSubtotal + $taxableAddonsTotal + $taxableVisaTotal) * ($vatRate / 100));
        $grandTotal = $discountedSubtotal + $taxAmount + $platformFee + $addonsTotal + $visaTotal;

        return [
            'subtotal_guests' => $subtotalGuests,
            'discounted_subtotal' => $discountedSubtotal,
            'promotion_discount' => $promotionDiscount,
            'platform_fee' => (float) $platformFee,
            'platform_fee_per_pax' => $this->platformFeePerPax(),
            'tax_amount' => $taxAmount,
            'tax_rate' => $vatRate,
            'addons_total' => $addonsTotal,
            'taxable_addons_total' => $taxableAddonsTotal,
            'visa_total' => $visaTotal,
            'taxable_visa_total' => $taxableVisaTotal,
            'agent_commission' => (float) $agentCommission,
            'travelboost_commission' => (float) $travelboostCommission,
            'grand_total' => (float) $grandTotal,
            'pax_count' => $paxCount,
            'passengers' => $quotedPassengers,
            'addons' => $quotedAddons,
            'agent_commission_breakdown' => $agentBreakdown,
            'travelboost_commission_breakdown' => $travelboostBreakdown,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function quoteForBooking(Booking $booking): array
    {
        $booking->loadMissing(['vendor.companySetting', 'tour.company.companySetting', 'passengers', 'addons']);

        if ($booking->passengers->isEmpty()) {
            return $this->legacySnapshotQuote($booking);
        }

        return $this->bookingSnapshotQuote($booking);
    }

    /**
     * @return array{total_price: float, tax_amount: float, platform_fee: float, commission_amount: float, grand_total: float}
     */
    public function bookingTotalsFromQuote(array $quote): array
    {
        return [
            'total_price' => (float) $quote['subtotal_guests'],
            'tax_amount' => (float) $quote['tax_amount'],
            'platform_fee' => (float) $quote['platform_fee'],
            'commission_amount' => (float) $quote['agent_commission'],
            'grand_total' => (float) $quote['grand_total'],
        ];
    }

    public function reconcileSnapshotTotals(Booking $booking): Booking
    {
        $booking->loadMissing(['passengers', 'addons', 'vendor.companySetting', 'tour.company.companySetting']);

        if ($booking->passengers->isEmpty()) {
            return $booking;
        }

        $hasVisaSnapshots = $booking->passengers->contains(
            fn ($passenger): bool => (float) $passenger->visa_type_price > 0
        );

        if ($booking->addons->isEmpty() && ! $hasVisaSnapshots) {
            return $booking;
        }

        $totals = $this->bookingTotalsFromQuote($this->quoteForBooking($booking));

        if (abs((float) $booking->grand_total - (float) $totals['grand_total']) < 0.01) {
            return $booking;
        }

        $booking->forceFill($totals)->save();

        return $booking->refresh();
    }

    /**
     * @return array<string, mixed>
     */
    private function adminConfig(): array
    {
        return AppConfig::query()->where('key', 'admin')->first()?->value ?? [];
    }

    private function normalizeDate(string|DateTimeInterface $departureDate): string
    {
        if ($departureDate instanceof DateTimeInterface) {
            return Carbon::instance($departureDate)->toDateString();
        }

        return Carbon::parse($departureDate)->toDateString();
    }

    private function resolveSchedule(Tour $tour, string $departureDate): ?TourSchedule
    {
        return TourSchedule::query()
            ->where('tour_id', $tour->id)
            ->where('company_id', $tour->company_id)
            ->whereDate('departure_date', $departureDate)
            ->latest('id')
            ->first();
    }

    /**
     * @return Collection<string, TourPrice>
     */
    private function tourPricesByCategory(Tour $tour, ?TourSchedule $schedule): Collection
    {
        return TourPrice::query()
            ->with('priceCategory')
            ->where('company_id', $tour->company_id)
            ->where('tour_code', $tour->code)
            ->when($schedule, fn ($query) => $query->where('schedule_id', $schedule->id))
            ->get()
            ->keyBy(fn (TourPrice $tourPrice): string => $this->categoryKey((string) $tourPrice->priceCategory?->name));
    }

    /**
     * @param  Collection<string, TourPrice>  $tourPrices
     */
    private function matchTourPrice(Collection $tourPrices, string $categoryName): ?TourPrice
    {
        if ($categoryName === '') {
            return null;
        }

        return $tourPrices->get($this->categoryKey($categoryName));
    }

    private function categoryKey(string $categoryName): string
    {
        return mb_strtolower(trim($categoryName));
    }

    private function discountedPrice(TourPrice $tourPrice): float
    {
        $basePrice = (float) $tourPrice->price;
        $promotionRate = (float) ($tourPrice->promotion_rate ?? 0);
        $promotion = (float) ($tourPrice->promotion ?? 0);

        if ($promotionRate > 0) {
            return max(0.0, (float) round($basePrice - (($basePrice * $promotionRate) / 100)));
        }

        if ($promotion > 0) {
            return max(0.0, (float) round($basePrice - $promotion));
        }

        return $basePrice;
    }

    private function travelboostCommissionForPassengerPrice(float $priceAmount): float
    {
        if ($priceAmount <= 0) {
            return 0.0;
        }

        $config = $this->adminConfig();
        $min = $this->numericConfigValue(data_get($config, 'commission_min'), self::DEFAULT_TRAVELBOOST_COMMISSION_MIN);
        $mid = $this->numericConfigValue(data_get($config, 'commission_mid'), self::DEFAULT_TRAVELBOOST_COMMISSION_MID);
        $max = $this->numericConfigValue(data_get($config, 'commission_max'), self::DEFAULT_TRAVELBOOST_COMMISSION_MAX);

        if ($priceAmount < 10_000_000) {
            return $min;
        }

        if ($priceAmount <= 20_000_000) {
            return $mid;
        }

        return $max;
    }

    private function numericConfigValue(mixed $value, float $fallback): float
    {
        return is_numeric($value) && (float) $value >= 0
            ? (float) $value
            : $fallback;
    }

    /**
     * @param  array<int, array<string, mixed>>  $addons
     * @return array<int, array<string, mixed>>
     */
    private function quoteAddons(Tour $tour, ?TourSchedule $schedule, array $addons): array
    {
        if ($addons === []) {
            return [];
        }

        $tourAddons = TourAddOn::query()
            ->where('company_id', $tour->company_id)
            ->where('tour_id', $tour->id)
            ->when($schedule, fn ($query) => $query->where('schedule_id', $schedule->id))
            ->get()
            ->keyBy(fn (TourAddOn $addon): string => $this->categoryKey((string) $addon->description));

        return collect($addons)
            ->map(function (array $addon) use ($tourAddons): array {
                $name = (string) (data_get($addon, 'name') ?? data_get($addon, 'label') ?? '');
                $matchedAddon = $tourAddons->get($this->categoryKey($name));
                $quantity = max(1, (int) data_get($addon, 'qty', 1));
                $unitPrice = $matchedAddon ? (float) $matchedAddon->price : (float) data_get($addon, 'price', 0);

                return [
                    'name' => $name,
                    'price' => $matchedAddon ? $unitPrice * $quantity : $unitPrice,
                    'is_taxable' => $matchedAddon ? (bool) $matchedAddon->is_taxable : (bool) data_get($addon, 'is_taxable', false),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return Collection<int, VisaCategoryItem>
     */
    private function visaItemsById(Tour $tour): Collection
    {
        if (! $tour->visa_category_id) {
            return collect();
        }

        return VisaCategoryItem::query()
            ->where('visa_category_id', $tour->visa_category_id)
            ->get()
            ->keyBy('id');
    }

    /**
     * @param  Collection<int, VisaCategoryItem>  $visaItemsById
     * @return array{visa_category_item_id: int|null, visa_type_description: string|null, visa_type_price: float, visa_type_is_taxable: bool}
     */
    private function passengerVisaSnapshot(array $passenger, Collection $visaItemsById): array
    {
        $visaCategoryItemId = data_get($passenger, 'visa_category_item_id');

        if ($visaCategoryItemId) {
            $visaItem = $visaItemsById->get((int) $visaCategoryItemId);

            if ($visaItem instanceof VisaCategoryItem) {
                return [
                    'visa_category_item_id' => $visaItem->id,
                    'visa_type_description' => $visaItem->description,
                    'visa_type_price' => (float) $visaItem->price,
                    'visa_type_is_taxable' => (bool) $visaItem->is_taxable,
                ];
            }
        }

        return [
            'visa_category_item_id' => null,
            'visa_type_description' => null,
            'visa_type_price' => 0.0,
            'visa_type_is_taxable' => false,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function bookingSnapshotQuote(Booking $booking): array
    {
        $schedule = $booking->tour
            ? $this->resolveSchedule($booking->tour, $this->normalizeDate($booking->departure_date))
            : null;
        $passengers = $booking->passengers
            ->values()
            ->map(fn ($passenger): array => $passenger->toArray())
            ->all();
        $discountedSubtotal = (float) $booking->passengers->sum('price_amount');
        $subtotalGuests = (float) $booking->total_price;
        $visaTotal = (float) $booking->passengers->sum('visa_type_price');
        $taxableVisaTotal = (float) $booking->passengers
            ->filter(fn ($passenger): bool => (bool) $passenger->visa_type_is_taxable)
            ->sum('visa_type_price');
        $addonsTotal = (float) $booking->addons->sum('price');
        $taxableAddonsTotal = (float) $booking->addons
            ->filter(fn ($addon): bool => (bool) $addon->is_taxable)
            ->sum('price');
        $taxRate = (float) ($booking->vendor?->companySetting?->minimum_vat ?? $booking->tour?->company?->companySetting?->minimum_vat ?? self::DEFAULT_PPN_RATE);
        $taxAmount = (float) round(($discountedSubtotal + $taxableAddonsTotal + $taxableVisaTotal) * ($taxRate / 100));
        $grandTotal = $discountedSubtotal + $taxAmount + (float) $booking->platform_fee + $addonsTotal + $visaTotal;
        $travelboostBreakdown = $booking->passengers
            ->values()
            ->map(function ($passenger, int $index): array {
                $priceAmount = (float) $passenger->price_amount;

                return [
                    'passenger_index' => $index,
                    'price_category' => (string) $passenger->price_category,
                    'price_amount' => $priceAmount,
                    'commission_amount' => $this->travelboostCommissionForPassengerPrice($priceAmount),
                ];
            })
            ->filter(fn (array $breakdown): bool => (float) $breakdown['commission_amount'] > 0)
            ->values()
            ->all();
        $travelboostCommission = (float) collect($travelboostBreakdown)->sum('commission_amount');
        [$agentCommission, $agentBreakdown] = $this->agentCommissionForBookingSnapshot($booking, $schedule);

        return [
            'source' => 'booking_snapshot',
            'subtotal_guests' => $subtotalGuests,
            'discounted_subtotal' => $discountedSubtotal,
            'promotion_discount' => max(0.0, $subtotalGuests - $discountedSubtotal),
            'platform_fee' => (float) $booking->platform_fee,
            'platform_fee_per_pax' => $this->platformFeePerPax(),
            'tax_amount' => $taxAmount,
            'tax_rate' => $taxRate,
            'addons_total' => $addonsTotal,
            'taxable_addons_total' => $taxableAddonsTotal,
            'visa_total' => $visaTotal,
            'taxable_visa_total' => $taxableVisaTotal,
            'agent_commission' => $agentCommission,
            'travelboost_commission' => $travelboostCommission,
            'grand_total' => (float) $grandTotal,
            'pax_count' => $booking->passengers->count(),
            'passengers' => $passengers,
            'addons' => $booking->addons->map->toArray()->all(),
            'agent_commission_breakdown' => $agentBreakdown,
            'travelboost_commission_breakdown' => [
                'source' => 'booking_snapshot',
                'passengers' => $travelboostBreakdown,
            ],
        ];
    }

    /**
     * @return array{0: float, 1: array<string, mixed>}
     */
    private function agentCommissionForBookingSnapshot(Booking $booking, ?TourSchedule $schedule): array
    {
        if (! $booking->agent_id || ! $booking->tour) {
            return [0.0, ['source' => 'not_applicable', 'passengers' => []]];
        }

        if ((float) $booking->commission_amount > 0) {
            return [
                (float) $booking->commission_amount,
                [
                    'source' => 'booking_snapshot',
                    'commission_amount' => (float) $booking->commission_amount,
                    'passengers' => $booking->passengers
                        ->values()
                        ->map(fn ($passenger, int $index): array => [
                            'passenger_index' => $index,
                            'price_category' => (string) $passenger->price_category,
                            'price_amount' => (float) $passenger->price_amount,
                        ])
                        ->all(),
                ],
            ];
        }

        $tourPrices = $this->tourPricesByCategory($booking->tour, $schedule);
        $passengerBreakdowns = [];
        $agentCommission = 0.0;

        foreach ($booking->passengers->values() as $index => $passenger) {
            $categoryName = (string) $passenger->price_category;
            $tourPrice = $this->matchTourPrice($tourPrices, $categoryName);

            if (! $tourPrice) {
                continue;
            }

            $resolution = app(AgentCommissionResolver::class)->resolve(
                $booking->tour,
                $schedule,
                $tourPrice,
                (float) $passenger->price_amount,
                (int) $booking->agent_id,
            );
            $amount = (float) $resolution['amount'];
            $agentCommission += $amount;

            if ($amount <= 0) {
                continue;
            }

            $passengerBreakdowns[] = [
                'passenger_index' => $index,
                'price_category' => $categoryName,
                'price_amount' => (float) $passenger->price_amount,
                'commission_amount' => $amount,
                'breakdown' => $resolution['breakdown'],
            ];
        }

        $firstMatrixBreakdown = collect($passengerBreakdowns)
            ->pluck('breakdown')
            ->first(fn (array $breakdown): bool => ($breakdown['source'] ?? null) === 'commission_matrix');

        return [
            (float) $agentCommission,
            [
                'source' => $firstMatrixBreakdown ? 'commission_matrix' : 'booking_snapshot_recalculated',
                'base_rule_amount' => (float) data_get($firstMatrixBreakdown, 'base_rule_amount', 0),
                'schedule_adjustment_amount' => (float) data_get($firstMatrixBreakdown, 'schedule_adjustment_amount', 0),
                'additional_rule_amount' => (float) data_get($firstMatrixBreakdown, 'additional_rule_amount', 0),
                'passengers' => $passengerBreakdowns,
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function legacySnapshotQuote(Booking $booking): array
    {
        return [
            'source' => 'legacy_booking_snapshot',
            'subtotal_guests' => (float) $booking->total_price,
            'discounted_subtotal' => (float) $booking->total_price,
            'promotion_discount' => 0.0,
            'platform_fee' => 0.0,
            'platform_fee_per_pax' => $this->platformFeePerPax(),
            'tax_amount' => (float) $booking->tax_amount,
            'tax_rate' => (float) ($booking->vendor?->companySetting?->minimum_vat ?? self::DEFAULT_PPN_RATE),
            'addons_total' => (float) $booking->addons->sum('price'),
            'taxable_addons_total' => (float) $booking->addons
                ->filter(fn ($addon): bool => (bool) $addon->is_taxable)
                ->sum('price'),
            'visa_total' => 0.0,
            'taxable_visa_total' => 0.0,
            'agent_commission' => 0.0,
            'travelboost_commission' => 0.0,
            'grand_total' => (float) $booking->grand_total,
            'pax_count' => (int) $booking->pax_adult + (int) $booking->pax_child + (int) $booking->pax_infant,
            'passengers' => [],
            'addons' => $booking->addons->map->toArray()->all(),
            'agent_commission_breakdown' => ['source' => 'legacy_booking_snapshot', 'passengers' => []],
            'travelboost_commission_breakdown' => ['source' => 'legacy_booking_snapshot', 'passengers' => []],
        ];
    }
}
