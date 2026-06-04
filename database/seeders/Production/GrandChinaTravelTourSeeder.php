<?php

namespace Database\Seeders\Production;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class GrandChinaTravelTourSeeder extends Seeder
{
    public function run(): void
    {
        $company = DB::table('companies')
            ->where('username', 'grandchinatravel')
            ->first();

        if (! $company) {
            $this->command->warn("Company 'grandchinatravel' not found. Skipping Grand China Travel tour seeding.");

            return;
        }

        $continent = DB::table('continents')->where('name', 'Asia')->first();
        $region = DB::table('regions')->where('name', 'East Asia')->first();
        $country = DB::table('countries')->where('name', 'China')->first();

        if (! $continent || ! $region || ! $country) {
            $this->command->warn('Asia, East Asia, or China reference data is missing. Skipping Grand China Travel tour seeding.');

            return;
        }

        DB::transaction(function () use ($company, $continent, $region, $country): void {
            $commissionCategoryId = $this->seedCommissionCategory((int) $company->id);
            $priceCategoryIds = $this->seedPriceCategories((int) $company->id);

            foreach ($this->tours() as $tourData) {
                $tourId = $this->seedTour(
                    (int) $company->id,
                    (int) $continent->id,
                    (int) $region->id,
                    (int) $country->id,
                    $commissionCategoryId,
                    $tourData
                );

                foreach ($tourData['schedules'] as $scheduleData) {
                    $this->seedSchedule(
                        (int) $company->id,
                        $tourId,
                        $tourData['code'],
                        $priceCategoryIds,
                        $tourData['price_sets'][$scheduleData['price_set']],
                        $tourData['add_ons'],
                        $scheduleData
                    );
                }
            }
        });

        $this->command->info('5 Grand China Travel tours seeded with schedules, availability, pricing, and add-ons.');
    }

    private function seedCommissionCategory(int $companyId): int
    {
        $slug = Str::slug('Promo Umum');
        $category = DB::table('product_commission_categories')
            ->where('company_id', $companyId)
            ->where('slug', $slug)
            ->first();

        if ($category) {
            DB::table('product_commission_categories')
                ->where('id', $category->id)
                ->update([
                    'category_name' => 'Promo Umum',
                    'description' => 'General promotional tour products.',
                    'is_active' => true,
                    'updated_at' => now(),
                ]);

            return (int) $category->id;
        }

        return (int) DB::table('product_commission_categories')->insertGetId([
            'company_id' => $companyId,
            'category_name' => 'Promo Umum',
            'description' => 'General promotional tour products.',
            'slug' => $slug,
            'sort_order' => 4,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function seedPriceCategories(int $companyId): array
    {
        $categories = [
            'shared' => [
                'name' => 'Adult/Child Twin Share/Child Extra Bed',
                'room_type' => 'Adult Twin',
                'description' => 'Adult or child twin share and child extra bed.',
            ],
            'child_no_bed' => [
                'name' => 'Child No Bed',
                'room_type' => 'Child No Bed',
                'description' => 'Child without bed.',
            ],
            'single_supplement' => [
                'name' => 'Single Supplement',
                'room_type' => 'Adult Single',
                'description' => 'Single room supplement.',
            ],
        ];

        $categoryIds = [];

        foreach ($categories as $key => $category) {
            $existingCategory = DB::table('price_categories')
                ->where('company_id', $companyId)
                ->where('name', $category['name'])
                ->first();

            if ($existingCategory) {
                DB::table('price_categories')
                    ->where('id', $existingCategory->id)
                    ->update([
                        'room_type' => $category['room_type'],
                        'description' => $category['description'],
                        'updated_at' => now(),
                    ]);

                $categoryIds[$key] = (int) $existingCategory->id;

                continue;
            }

            $categoryIds[$key] = (int) DB::table('price_categories')->insertGetId([
                'company_id' => $companyId,
                'name' => $category['name'],
                'room_type' => $category['room_type'],
                'description' => $category['description'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return $categoryIds;
    }

    private function seedTour(
        int $companyId,
        int $continentId,
        int $regionId,
        int $countryId,
        int $commissionCategoryId,
        array $tourData
    ): int {
        $tour = DB::table('tours')
            ->where('company_id', $companyId)
            ->where('code', $tourData['code'])
            ->first();

        $values = [
            'name' => $tourData['name'],
            'description' => $tourData['description'],
            'duration_days' => $tourData['duration_days'],
            'status' => 'active',
            'destination' => $tourData['destination'],
            'continent_name' => 'Asia',
            'region_name' => 'East Asia',
            'country_name' => 'China',
            'showprice' => $tourData['showprice'],
            'earlybird' => 0,
            'earlybird_note' => '',
            'currency' => 'IDR',
            'promoprice' => 0,
            'promote_price' => 0,
            'continent_id' => $continentId,
            'region_id' => $regionId,
            'country_id' => $countryId,
            'product_commission_category_id' => $commissionCategoryId,
            'updated_at' => now(),
        ];

        if ($tour) {
            DB::table('tours')
                ->where('id', $tour->id)
                ->update($values);

            return (int) $tour->id;
        }

        return (int) DB::table('tours')->insertGetId([
            ...$values,
            'code' => $tourData['code'],
            'company_id' => $companyId,
            'category_id' => null,
            'image_id' => null,
            'document_id' => null,
            'created_at' => now(),
        ]);
    }

    private function seedSchedule(
        int $companyId,
        int $tourId,
        string $tourCode,
        array $priceCategoryIds,
        array $prices,
        array $addOns,
        array $scheduleData
    ): void {
        $schedule = DB::table('tour_schedules')
            ->where('tour_id', $tourId)
            ->where('departure_date', $scheduleData['departure_date'])
            ->first();

        $values = [
            'tour_code' => $tourCode,
            'company_id' => $companyId,
            'return_date' => $scheduleData['return_date'],
            'is_active' => true,
            'note' => null,
            'updated_at' => now(),
        ];

        if ($schedule) {
            DB::table('tour_schedules')
                ->where('id', $schedule->id)
                ->update($values);

            $scheduleId = (int) $schedule->id;
        } else {
            $scheduleId = (int) DB::table('tour_schedules')->insertGetId([
                ...$values,
                'tour_id' => $tourId,
                'departure_date' => $scheduleData['departure_date'],
                'created_at' => now(),
            ]);
        }

        foreach ($prices as $category => $price) {
            DB::table('tour_prices')->updateOrInsert(
                [
                    'schedule_id' => $scheduleId,
                    'price_category_id' => $priceCategoryIds[$category],
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

        foreach ($addOns as $description => $price) {
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
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        $availability = DB::table('tour_availabilities')
            ->where('company_id', $companyId)
            ->where('tour_id', $tourId)
            ->where('schedule_id', $scheduleId)
            ->exists();

        if (! $availability) {
            DB::table('tour_availabilities')->insert([
                'company_id' => $companyId,
                'tour_id' => $tourId,
                'schedule_id' => $scheduleId,
                'max_pax' => 24,
                'RS' => 0,
                'WP' => 0,
                'WPA' => 0,
                'DP' => 0,
                'FP' => 0,
                'WA' => 0,
                'BRS' => 0,
                'CA' => 0,
                'RF' => 0,
                'EX' => 0,
                'WL' => 0,
                'available' => 24,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function tours(): array
    {
        $nanjingSchedules = [
            ['departure_date' => '2026-05-09', 'return_date' => '2026-05-16', 'price_set' => 'standard'],
            ['departure_date' => '2026-05-16', 'return_date' => '2026-05-23', 'price_set' => 'standard'],
            ['departure_date' => '2026-05-23', 'return_date' => '2026-05-30', 'price_set' => 'standard'],
            ['departure_date' => '2026-05-30', 'return_date' => '2026-06-06', 'price_set' => 'standard'],
            ['departure_date' => '2026-06-06', 'return_date' => '2026-06-13', 'price_set' => 'regular'],
            ['departure_date' => '2026-06-13', 'return_date' => '2026-06-20', 'price_set' => 'regular'],
            ['departure_date' => '2026-09-05', 'return_date' => '2026-09-12', 'price_set' => 'regular'],
            ['departure_date' => '2026-09-12', 'return_date' => '2026-09-19', 'price_set' => 'regular'],
            ['departure_date' => '2026-10-10', 'return_date' => '2026-10-17', 'price_set' => 'regular'],
            ['departure_date' => '2026-06-20', 'return_date' => '2026-06-27', 'price_set' => 'peak'],
            ['departure_date' => '2026-06-27', 'return_date' => '2026-07-04', 'price_set' => 'peak'],
        ];

        $nanjingPriceSets = [
            'standard' => [
                'shared' => 10980000,
                'child_no_bed' => 10680000,
                'single_supplement' => 2300000,
            ],
            'regular' => [
                'shared' => 11280000,
                'child_no_bed' => 10980000,
                'single_supplement' => 2300000,
            ],
            'peak' => [
                'shared' => 12080000,
                'child_no_bed' => 11780000,
                'single_supplement' => 2300000,
            ],
        ];

        $nanjingAddOns = [
            'Visa Group' => 980000,
            'Tipping' => 850000,
        ];

        return [
            [
                'code' => 'GCT-01-001',
                'name' => '8D Lingshan Wangxian Valley',
                'description' => 'Lingshan Wangxian Valley.',
                'duration_days' => 8,
                'destination' => 'Jakarta - Wuhan - Jiujiang - Wuyuan',
                'showprice' => 19380000,
                'schedules' => [
                    ['departure_date' => '2026-06-08', 'return_date' => '2026-06-15', 'price_set' => 'standard'],
                    ['departure_date' => '2026-09-07', 'return_date' => '2026-09-14', 'price_set' => 'standard'],
                    ['departure_date' => '2026-09-14', 'return_date' => '2026-09-22', 'price_set' => 'standard'],
                    ['departure_date' => '2026-10-12', 'return_date' => '2026-10-20', 'price_set' => 'standard'],
                    ['departure_date' => '2026-06-15', 'return_date' => '2026-06-22', 'price_set' => 'peak'],
                    ['departure_date' => '2026-06-22', 'return_date' => '2026-07-01', 'price_set' => 'peak'],
                    ['departure_date' => '2026-09-21', 'return_date' => '2026-09-29', 'price_set' => 'peak'],
                ],
                'price_sets' => [
                    'standard' => [
                        'shared' => 13380000,
                        'child_no_bed' => 13080000,
                        'single_supplement' => 3000000,
                    ],
                    'peak' => [
                        'shared' => 14180000,
                        'child_no_bed' => 15880000,
                        'single_supplement' => 3000000,
                    ],
                ],
                'add_ons' => [
                    'Visa Group' => 980000,
                    'Tipping' => 900000,
                ],
            ],
            [
                'code' => 'GCT-01-002',
                'name' => '6D Wuhan',
                'description' => '6D Wuhan - Xiantao - Yichang.',
                'duration_days' => 6,
                'destination' => 'Jakarta - Wuhan - Xiantao - Yichang',
                'showprice' => 14580000,
                'schedules' => [
                    ['departure_date' => '2026-06-05', 'return_date' => '2026-06-11', 'price_set' => 'standard'],
                    ['departure_date' => '2026-06-12', 'return_date' => '2026-06-18', 'price_set' => 'standard'],
                    ['departure_date' => '2026-09-04', 'return_date' => '2026-09-10', 'price_set' => 'standard'],
                    ['departure_date' => '2026-09-11', 'return_date' => '2026-09-17', 'price_set' => 'standard'],
                    ['departure_date' => '2026-09-14', 'return_date' => '2026-09-20', 'price_set' => 'standard'],
                    ['departure_date' => '2026-06-19', 'return_date' => '2026-06-25', 'price_set' => 'peak'],
                    ['departure_date' => '2026-06-26', 'return_date' => '2026-07-02', 'price_set' => 'peak'],
                    ['departure_date' => '2026-10-09', 'return_date' => '2026-10-15', 'price_set' => 'peak'],
                ],
                'price_sets' => [
                    'standard' => [
                        'shared' => 9780000,
                        'child_no_bed' => 9480000,
                        'single_supplement' => 1800000,
                    ],
                    'peak' => [
                        'shared' => 10780000,
                        'child_no_bed' => 10480000,
                        'single_supplement' => 1600000,
                    ],
                ],
                'add_ons' => [
                    'Visa Group' => 980000,
                    'Tipping' => 650000,
                ],
            ],
            [
                'code' => 'GCT-01-003',
                'name' => '8D Wuhan - Xiantao - Xianning - Yichang - Qichun',
                'description' => '8D Wuhan - Xiantao - Xianning - Yichang - Qichun.',
                'duration_days' => 8,
                'destination' => 'Jakarta - Wuhan - Xiantao - Xianning - Yichang - Qichun',
                'showprice' => 16180000,
                'schedules' => [
                    ['departure_date' => '2026-05-11', 'return_date' => '2026-05-18', 'price_set' => 'standard'],
                    ['departure_date' => '2026-05-18', 'return_date' => '2026-05-25', 'price_set' => 'standard'],
                    ['departure_date' => '2026-05-25', 'return_date' => '2026-06-02', 'price_set' => 'standard'],
                    ['departure_date' => '2026-06-08', 'return_date' => '2026-06-16', 'price_set' => 'regular'],
                    ['departure_date' => '2026-09-07', 'return_date' => '2026-09-14', 'price_set' => 'regular'],
                    ['departure_date' => '2026-09-14', 'return_date' => '2026-09-21', 'price_set' => 'regular'],
                    ['departure_date' => '2026-10-12', 'return_date' => '2026-10-19', 'price_set' => 'regular'],
                    ['departure_date' => '2026-06-15', 'return_date' => '2026-06-22', 'price_set' => 'peak'],
                    ['departure_date' => '2026-06-22', 'return_date' => '2026-06-29', 'price_set' => 'peak'],
                    ['departure_date' => '2026-09-21', 'return_date' => '2026-09-28', 'price_set' => 'peak'],
                ],
                'price_sets' => [
                    'standard' => [
                        'shared' => 10980000,
                        'child_no_bed' => 10680000,
                        'single_supplement' => 2200000,
                    ],
                    'regular' => [
                        'shared' => 12280000,
                        'child_no_bed' => 11980000,
                        'single_supplement' => 2200000,
                    ],
                    'peak' => [
                        'shared' => 13180000,
                        'child_no_bed' => 12880000,
                        'single_supplement' => 2200000,
                    ],
                ],
                'add_ons' => [
                    'Visa Group' => 980000,
                    'Tipping' => 850000,
                ],
            ],
            [
                'code' => 'GCT-02-001',
                'name' => '8D Nanjing Wuyuan Wangxian Valley',
                'description' => 'Nanjing - Wuyuan - Wangxian Valley - Shenxianju - Hangzhou - Shanghai.',
                'duration_days' => 8,
                'destination' => 'Jakarta - Nanjing - Wuyuan - Wangxian Valley - Shenxianju - Hangzhou - Shanghai',
                'showprice' => 16280000,
                'schedules' => $nanjingSchedules,
                'price_sets' => $nanjingPriceSets,
                'add_ons' => $nanjingAddOns,
            ],
            [
                'code' => 'GCT-02-002',
                'name' => '8D Nanjing Huangshan Wuyuan Shangrao Hangzhou Shanghai',
                'description' => 'Nanjing - Huangshan - Wuyuan - Shangrao - Hangzhou - Shanghai.',
                'duration_days' => 8,
                'destination' => 'Jakarta - Nanjing - Huangshan - Wuyuan - Shangrao - Hangzhou - Shanghai',
                'showprice' => 16280000,
                'schedules' => $nanjingSchedules,
                'price_sets' => $nanjingPriceSets,
                'add_ons' => $nanjingAddOns,
            ],
        ];
    }
}
