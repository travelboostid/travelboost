<?php

namespace Database\Seeders\Common;

use App\Models\ProductCommissionCategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductCommissionCategorySeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['category_name' => 'Produk Umum', 'sort_order' => 1],
            ['category_name' => 'Produk Promo', 'sort_order' => 2],
            ['category_name' => 'Produk Super Promo', 'sort_order' => 3],
        ];

        foreach ($items as $item) {
            ProductCommissionCategory::query()->updateOrCreate(
                [
                    'company_id' => null,
                    'slug' => Str::slug($item['category_name']),
                ],
                [
                    'category_name' => $item['category_name'],
                    'description' => $item['category_name'],
                    'sort_order' => $item['sort_order'],
                    'is_active' => true,
                ],
            );
        }
    }
}
