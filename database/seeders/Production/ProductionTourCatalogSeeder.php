<?php

namespace Database\Seeders\Production;

use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

abstract class ProductionTourCatalogSeeder extends Seeder
{
    abstract protected function vendorUsername(): string;

    /**
     * @return list<array{
     *     code: string,
     *     name: string,
     *     description: string,
     *     duration_days: int,
     *     continent: string,
     *     country: string,
     *     region: string,
     *     destination: string,
     *     product_commission_category: string,
     *     showprice: int,
     *     add_ons: array<string, int|array{price:int,is_taxable:bool}>,
     *     price_sets: list<array{
     *         departures: string,
     *         availability: int,
     *         prices: array<string, int>
     *     }>
     * }>
     */
    abstract protected function tours(): array;

    public function run(): void
    {
        $company = DB::table('companies')
            ->where('username', $this->vendorUsername())
            ->first();

        if (! $company) {
            $this->command?->warn("Company '{$this->vendorUsername()}' not found. Skipping production tour seeding.");

            return;
        }

        $priceCategoryIds = $this->priceCategoryIds((int) $company->id);
        $seededTours = 0;
        $seededSchedules = 0;

        DB::transaction(function () use ($company, $priceCategoryIds, &$seededTours, &$seededSchedules): void {
            foreach ($this->tours() as $tourData) {
                $tourId = $this->seedTour((int) $company->id, $tourData);
                $seededTours++;

                foreach ($tourData['price_sets'] as $priceSet) {
                    foreach ($this->departureDates($priceSet['departures']) as $departureDate) {
                        $this->seedSchedule(
                            (int) $company->id,
                            $tourId,
                            $tourData,
                            $priceCategoryIds,
                            $priceSet,
                            $departureDate
                        );

                        $seededSchedules++;
                    }
                }
            }
        });

        $this->command?->info(sprintf(
            '%s production tours seeded: %d tours, %d schedules.',
            $company->name,
            $seededTours,
            $seededSchedules
        ));
    }

    /**
     * @return array<string, int>
     */
    private function priceCategoryIds(int $companyId): array
    {
        $names = [
            'Adult Single',
            'Adult Twin',
            'Adult Double',
            'Adult Extra Bed',
            'Child With Bed',
            'Child No Bed',
            'Infant',
        ];

        return DB::table('price_categories')
            ->where('company_id', $companyId)
            ->whereIn('name', $names)
            ->pluck('id', 'name')
            ->mapWithKeys(fn ($id, $name): array => [(string) $name => (int) $id])
            ->all();
    }

    /**
     * @param  array<string, mixed>  $tourData
     */
    private function seedTour(int $companyId, array $tourData): int
    {
        $now = now();
        $continentId = $this->lookupId('continents', $tourData['continent']);
        $regionId = $this->lookupId('regions', $tourData['region']);
        $countryId = $this->lookupId('countries', $tourData['country']);
        $productCommissionCategoryId = $this->productCommissionCategoryId(
            $companyId,
            $tourData['product_commission_category']
        );
        $visaCategoryId = $this->visaCategoryId($companyId, 'Visa Group A');

        $values = [
            'name' => $tourData['name'],
            'description' => $tourData['description'],
            'duration_days' => $tourData['duration_days'],
            'status' => 'active',
            'destination' => $tourData['destination'],
            'continent_name' => $tourData['continent'],
            'region_name' => $tourData['region'],
            'country_name' => $tourData['country'],
            'showprice' => $tourData['showprice'],
            'earlybird' => 0,
            'earlybird_note' => '',
            'currency' => 'IDR',
            'promoprice' => 0,
            'promote_title' => null,
            'promote_price' => 0,
            'promote_note' => null,
            'company_id' => $companyId,
            'continent_id' => $continentId,
            'region_id' => $regionId,
            'country_id' => $countryId,
            'category_id' => null,
            'product_commission_category_id' => $productCommissionCategoryId,
            'visa_category_id' => $visaCategoryId,
            'user_id' => null,
            'image_id' => null,
            'document_id' => null,
            'updated_at' => $now,
        ];

        $existingTourId = DB::table('tours')
            ->where('company_id', $companyId)
            ->where('code', $tourData['code'])
            ->value('id');

        if ($existingTourId) {
            DB::table('tours')
                ->where('id', $existingTourId)
                ->update($values);

            return (int) $existingTourId;
        }

        return (int) DB::table('tours')->insertGetId([
            'code' => $tourData['code'],
            ...$values,
            'created_at' => $now,
        ]);
    }

    /**
     * @param  array<string, mixed>  $tourData
     * @param  array<string, int>  $priceCategoryIds
     * @param  array<string, mixed>  $priceSet
     */
    private function seedSchedule(
        int $companyId,
        int $tourId,
        array $tourData,
        array $priceCategoryIds,
        array $priceSet,
        string $departureDate
    ): void {
        $now = now();
        $returnDate = Carbon::parse($departureDate)
            ->addDays(max(0, (int) $tourData['duration_days'] - 1))
            ->toDateString();

        $schedule = DB::table('tour_schedules')
            ->where('tour_id', $tourId)
            ->whereDate('departure_date', $departureDate)
            ->first();

        $scheduleValues = [
            'tour_code' => $tourData['code'],
            'company_id' => $companyId,
            'return_date' => $returnDate,
            'cutoff_date' => null,
            'is_active' => true,
            'note' => null,
            'updated_at' => $now,
        ];

        if ($schedule) {
            DB::table('tour_schedules')
                ->where('id', $schedule->id)
                ->update($scheduleValues);

            $scheduleId = (int) $schedule->id;
        } else {
            $scheduleId = (int) DB::table('tour_schedules')->insertGetId([
                'tour_id' => $tourId,
                'departure_date' => $departureDate,
                ...$scheduleValues,
                'created_at' => $now,
            ]);
        }

        $this->seedPrices($companyId, $scheduleId, $tourData['code'], $priceCategoryIds, $priceSet['prices']);
        $this->seedAddOns($companyId, $tourId, $scheduleId, $tourData['add_ons']);
        $this->seedAvailability($companyId, $tourId, $scheduleId, (int) $priceSet['availability']);
    }

    /**
     * @param  array<string, int>  $priceCategoryIds
     * @param  array<string, int>  $prices
     */
    private function seedPrices(
        int $companyId,
        int $scheduleId,
        string $tourCode,
        array $priceCategoryIds,
        array $prices
    ): void {
        if (isset($priceCategoryIds['Infant'])) {
            DB::table('tour_prices')
                ->where('schedule_id', $scheduleId)
                ->where('price_category_id', $priceCategoryIds['Infant'])
                ->delete();
        }

        foreach ($prices as $categoryName => $price) {
            if ($categoryName === 'Infant') {
                continue;
            }

            if (! isset($priceCategoryIds[$categoryName])) {
                continue;
            }

            DB::table('tour_prices')->updateOrInsert(
                [
                    'schedule_id' => $scheduleId,
                    'price_category_id' => $priceCategoryIds[$categoryName],
                ],
                [
                    'company_id' => $companyId,
                    'tour_code' => $tourCode,
                    'currency' => 'IDR',
                    'price' => $price,
                    'promotion_rate' => 0,
                    'promotion' => 0,
                    'commission_rate' => 0,
                    'commission' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }

    /**
     * @param  array<string, int|array{price:int,is_taxable:bool}>  $addOns
     */
    private function seedAddOns(int $companyId, int $tourId, int $scheduleId, array $addOns): void
    {
        foreach ($addOns as $description => $definition) {
            $price = is_array($definition) ? (int) ($definition['price'] ?? 0) : (int) $definition;
            $isTaxable = is_array($definition) ? (bool) ($definition['is_taxable'] ?? false) : false;

            DB::table('tour_add_ons')->updateOrInsert(
                [
                    'company_id' => $companyId,
                    'schedule_id' => $scheduleId,
                    'description' => $description,
                ],
                [
                    'tour_id' => $tourId,
                    'price' => $price,
                    'edit_status' => false,
                    'is_taxable' => $isTaxable,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }

    private function seedAvailability(int $companyId, int $tourId, int $scheduleId, int $availability): void
    {
        DB::table('tour_availabilities')->updateOrInsert(
            [
                'company_id' => $companyId,
                'tour_id' => $tourId,
                'schedule_id' => $scheduleId,
            ],
            [
                'max_pax' => $availability,
                'RS' => 0,
                'WP' => 0,
                'WPA' => 0,
                'DP' => 0,
                'FP' => 0,
                'BRS' => 0,
                'WA' => 0,
                'CA' => 0,
                'RF' => 0,
                'EX' => 0,
                'WL' => 0,
                'available' => $availability,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    private function lookupId(string $table, string $name): ?int
    {
        $id = DB::table($table)
            ->where('name', $name)
            ->value('id');

        return $id ? (int) $id : null;
    }

    private function productCommissionCategoryId(int $companyId, string $sourceName): int
    {
        $categoryName = match (Str::lower(trim($sourceName))) {
            'umum', 'produk umum' => 'Produk Umum',
            'promo', 'produk promo' => 'Promo',
            'sp', 'super promo', 'produk super promo' => 'Super Promo',
            default => trim($sourceName) ?: 'Produk Umum',
        };

        $slug = Str::slug($categoryName);

        $existingId = DB::table('product_commission_categories')
            ->where('company_id', $companyId)
            ->where('slug', $slug)
            ->value('id');

        if ($existingId) {
            return (int) $existingId;
        }

        return (int) DB::table('product_commission_categories')->insertGetId([
            'company_id' => $companyId,
            'category_name' => $categoryName,
            'description' => $categoryName,
            'slug' => $slug,
            'sort_order' => match ($slug) {
                'produk-umum' => 1,
                'promo' => 2,
                'super-promo' => 3,
                default => 99,
            },
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function visaCategoryId(int $companyId, string $sourceName): ?int
    {
        return DB::table('visa_categories')
            ->where('company_id', $companyId)
            ->where('slug', Str::slug($sourceName))
            ->value('id');
    }

    /**
     * @return list<string>
     */
    private function departureDates(string $source): array
    {
        $monthNumbers = [
            'JANUARI' => 1,
            'JAN' => 1,
            'FEBRUARI' => 2,
            'FEB' => 2,
            'MARET' => 3,
            'MAR' => 3,
            'APRIL' => 4,
            'APR' => 4,
            'MAY' => 5,
            'MEI' => 5,
            'JUNI' => 6,
            'JUNE' => 6,
            'JUN' => 6,
            'JULI' => 7,
            'JULY' => 7,
            'JUL' => 7,
            'AGUSTUS' => 8,
            'AUGUST' => 8,
            'AUG' => 8,
            'AGU' => 8,
            'SEPTEMBER' => 9,
            'SEPT' => 9,
            'SEP' => 9,
            'OKTOBER' => 10,
            'OCTOBER' => 10,
            'OCT' => 10,
            'OKT' => 10,
            'NOVEMBER' => 11,
            'NOV' => 11,
            'DESEMBER' => 12,
            'DECEMBER' => 12,
            'DEC' => 12,
            'DES' => 12,
        ];

        $source = Str::upper(str_replace(['*', ';'], ' ', $source));
        $tokens = array_keys($monthNumbers);
        usort($tokens, fn (string $left, string $right): int => strlen($right) <=> strlen($left));
        $pattern = '/(?:'.implode('|', array_map(fn (string $token): string => preg_quote($token, '/'), $tokens)).')/';

        preg_match_all($pattern, $source, $matches, PREG_OFFSET_CAPTURE);

        $dates = [];
        $matchCount = count($matches[0]);

        for ($index = 0; $index < $matchCount; $index++) {
            $token = $matches[0][$index][0];
            $segmentStart = $matches[0][$index][1] + strlen($token);
            $segmentEnd = $matches[0][$index + 1][1] ?? strlen($source);
            $segment = substr($source, $segmentStart, $segmentEnd - $segmentStart);

            preg_match_all('/\d{1,2}/', $segment, $dayMatches);

            foreach ($dayMatches[0] as $day) {
                $dayNumber = (int) $day;

                if ($dayNumber < 1 || $dayNumber > 31) {
                    continue;
                }

                $dates[] = sprintf('2026-%02d-%02d', $monthNumbers[$token], $dayNumber);
            }
        }

        return array_values(array_unique($dates));
    }
}
