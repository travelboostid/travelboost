<?php

namespace Database\Seeders\Common;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ParameterTravelboostSeeder extends Seeder
{
    public function run(): void
    {

        $param_travelboost = [
            [
                'description' => 'Platform Fee / Pax',
                'amount' => 25000,
                'percentage' => 0,
            ],
            [
                'description' => 'Sales Commission / Pax (until 10.000.000)',
                'amount' => 50000,
                'percentage' => 0,
            ],
            [
                'description' => 'Sales Commission / Pax (10.000.000 - 20.000.000)',
                'amount' => 75000,
                'percentage' => 0,
            ],
            [
                'description' => 'Sales Commission / Pax (above 20.000.000)',
                'amount' => 100000,
                'percentage' => 0,
            ],
            [
                'description' => 'AI Credit Fee for new Agent',
                'amount' => 100000,
                'percentage' => 0,
            ],
            [
                'description' => 'Affiliate Commission',
                'amount' => 0,
                'percentage' => 15,
            ],
            [
                'description' => 'MA Commission',
                'amount' => 0,
                'percentage' => 10,
            ],
            [
                'description' => 'Partner Commission',
                'amount' => 0,
                'percentage' => 5,
            ],
        ];

        DB::table('parameter_travelboosts')->insert($param_travelboost);
    }
}