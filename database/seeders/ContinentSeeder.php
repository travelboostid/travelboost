<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ContinentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();

        $continents = [
            ['continent' => 'Asia', 'user_id' => 1],
            ['continent' => 'Europe', 'user_id' => 1],
            ['continent' => 'Africa', 'user_id' => 1],
            ['continent' => 'America', 'user_id' => 1],
            ['continent' => 'Australia', 'user_id' => 1],
        ];

        foreach ($continents as $data) {
            DB::table('continents')->updateOrInsert(
                ['continent' => $data['continent']], // key unik
                [
                    'user_id' => $data['user_id'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }
}
