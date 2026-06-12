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

        foreach ($vendors as $vendor) {
            foreach ($categories as $category) {
                $slug = Str::slug($category['name']);
                $existingId = DB::table('visa_categories')
                    ->where('company_id', $vendor->id)
                    ->where('slug', $slug)
                    ->value('id');

                if ($existingId) {
                    DB::table('visa_categories')
                        ->where('id', $existingId)
                        ->update([
                            'name' => $category['name'],
                            'updated_at' => now(),
                        ]);

                    $visaCategoryId = $existingId;
                } else {
                    $visaCategoryId = DB::table('visa_categories')->insertGetId([
                        'company_id' => $vendor->id,
                        'name' => $category['name'],
                        'slug' => $slug,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                if (! $visaCategoryId) {
                    continue;
                }

                DB::table('visa_category_items')
                    ->where('visa_category_id', $visaCategoryId)
                    ->delete();

                foreach ($category['items'] as $itemIndex => $item) {
                    DB::table('visa_category_items')->insert([
                        'visa_category_id' => $visaCategoryId,
                        'description' => $item['description'],
                        'price' => $item['price'],
                        'is_taxable' => $item['is_taxable'],
                        'sort_order' => $itemIndex,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }
}
