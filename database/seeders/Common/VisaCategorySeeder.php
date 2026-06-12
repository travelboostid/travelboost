<?php

namespace Database\Seeders\Common;

use App\Enums\CompanyType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class VisaCategorySeeder extends Seeder
{
    public function run(): void
    {
        $vendors = DB::table('companies')
            ->where('type', CompanyType::VENDOR->value)
            ->get(['id']);

        $categories = [
            [
                'name' => 'Visa Group A',
                'items' => [
                    ['description' => 'VOA', 'price' => 600000, 'is_taxable' => true],
                    ['description' => 'Visa Tempel', 'price' => 750000, 'is_taxable' => true],
                    ['description' => 'Ready Visa', 'price' => 100000, 'is_taxable' => false],
                ],
            ],
            [
                'name' => 'Visa Group B',
                'items' => [
                    ['description' => 'Visa Pelajar', 'price' => 150000, 'is_taxable' => false],
                    ['description' => 'Visa Kerja', 'price' => 400000, 'is_taxable' => true],
                    ['description' => 'Visa Turis', 'price' => 800000, 'is_taxable' => true],
                ],
            ],
        ];

        $now = now();

        foreach ($vendors as $vendor) {
            foreach ($categories as $category) {
                $slug = Str::slug($category['name']);

                DB::table('visa_categories')->updateOrInsert(
                    [
                        'company_id' => $vendor->id,
                        'slug' => $slug,
                    ],
                    [
                        'name' => $category['name'],
                        'updated_at' => $now,
                        'created_at' => $now,
                    ],
                );

                $visaCategoryId = DB::table('visa_categories')
                    ->where('company_id', $vendor->id)
                    ->where('slug', $slug)
                    ->value('id');

                if (! $visaCategoryId) {
                    continue;
                }

                $itemDescriptions = [];

                foreach ($category['items'] as $itemIndex => $item) {
                    $itemDescriptions[] = $item['description'];

                    DB::table('visa_category_items')->updateOrInsert(
                        [
                            'visa_category_id' => $visaCategoryId,
                            'description' => $item['description'],
                        ],
                        [
                            'price' => $item['price'],
                            'is_taxable' => $item['is_taxable'],
                            'sort_order' => $itemIndex,
                            'updated_at' => $now,
                            'created_at' => $now,
                        ],
                    );
                }

                DB::table('visa_category_items')
                    ->where('visa_category_id', $visaCategoryId)
                    ->whereNotIn('description', $itemDescriptions)
                    ->delete();
            }
        }
    }
}
