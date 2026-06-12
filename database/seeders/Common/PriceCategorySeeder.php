<?php

namespace Database\Seeders\Common;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PriceCategorySeeder extends Seeder
{
    public function run(): void
    {
        $companies = DB::table('companies')->pluck('id');

        $categories = [
            [
                'name' => 'Adult Single',
                'room_type' => 'Adult Single',
                'description' => 'Single room (1 person)',
            ],
            [
                'name' => 'Adult Double',
                'room_type' => 'Adult Double',
                'description' => 'Double room (2 persons)',
            ],
            [
                'name' => 'Adult Twin',
                'room_type' => 'Adult Twin',
                'description' => 'Twin room (2 persons)',
            ],
            [
                'name' => 'Adult Triple',
                'room_type' => 'Adult Triple',
                'description' => 'Triple room (3 persons)',
            ],
            [
                'name' => 'Adult Quad',
                'room_type' => 'Adult Quad',
                'description' => 'Quad room (4 persons)',
            ],
            [
                'name' => 'Adult Extra Bed',
                'room_type' => 'Adult Extra bed',
                'description' => 'Adult Extra Bed',
            ],
            [
                'name' => 'Child With Bed',
                'room_type' => 'Child With Extra bed',
                'description' => 'Child with extra bed',
            ],
            [
                'name' => 'Child No Bed',
                'room_type' => 'Child No Bed',
                'description' => 'Child without bed',
            ],
            [
                'name' => 'Infant',
                'room_type' => 'Infant',
                'description' => 'Infant (no seat / bed)',
            ],
        ];

        $now = now();

        foreach ($companies as $companyId) {
            foreach ($categories as $cat) {
                DB::table('price_categories')->updateOrInsert(
                    [
                        'company_id' => $companyId,
                        'name' => $cat['name'],
                    ],
                    [
                        'room_type' => $cat['room_type'],
                        'description' => $cat['description'],
                        'updated_at' => $now,
                        'created_at' => $now,
                    ],
                );
            }
        }
    }
}
