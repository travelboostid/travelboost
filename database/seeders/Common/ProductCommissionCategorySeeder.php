<?php

namespace Database\Seeders\Common;

use App\Models\ProductCommissionCategory;
use Illuminate\Database\Seeder;

class ProductCommissionCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $items = [
            'Produk Umum',
            'Produk Promo',
            'Produk Super Promo',
        ];

        foreach ($items as $item) {
            ProductCommissionCategory::create([
                'category_name' => $item,
                'description' => $item,
            ]);
        }
    }
}
