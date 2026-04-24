<?php

namespace Database\Seeders\Common;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PriceCategorySeeder extends Seeder
{
    public function run(): void
    {
        // ambil semua company
        $companies = DB::table('companies')->pluck('id');

        $categories = [
            [
                'name' => 'Adult Single',
                'description' => 'Single room (1 person)',
            ],
            [
                'name' => 'Adult Double',
                'description' => 'Double room (2 persons)',
            ],
            [
                'name' => 'Adult Twin',
                'description' => 'Double room (2 persons)',
            ],
            [
                'name' => 'Adult Triple',
                'description' => 'Triple room (3 persons)',
            ],
            [
                'name' => 'Child With Bed',
                'description' => 'Child with extra bed',
            ],
            [
                'name' => 'Child No Bed',
                'description' => 'Child without bed',
            ],
            [
                'name' => 'Infant',
                'description' => 'Infant (no seat / bed)',
            ],
        ];

        $data = [];

        foreach ($companies as $companyId) {
            foreach ($categories as $cat) {
                $data[] = [
                    'company_id' => $companyId,
                    'name' => $cat['name'],
                    'description' => $cat['description'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        DB::table('price_categories')->insert($data);
    }
}