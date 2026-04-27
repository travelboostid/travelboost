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
                'category'     => 'booking',
                'param_key'    => 'platform_fee',
                'param_label'  => 'Platform Fee',
                'data_type'    => 'value',
                'number_value' => 25000,
                'text_value'   => null,
                'is_active'    => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category'     => 'commission',
                'param_key'    => 'commission_min',
                'param_label'  => 'Commission <= 10.000.000',
                'data_type'    => 'value',
                'number_value' => 50000,
                'text_value'   => null,
                'is_active'    => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category'     => 'commission',
                'param_key'    => 'commission_mid',
                'param_label'  => 'Commission between 10.000.000 and 20.000.000',
                'data_type'    => 'value',
                'number_value' => 75000,
                'text_value'   => null,
                'is_active'    => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category'     => 'commission',
                'param_key'    => 'commission_max',
                'param_label'  => 'Commission > 20.000.000',
                'data_type'    => 'value',
                'number_value' => 100000,
                'text_value'   => null,
                'is_active'    => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category'     => 'free',
                'param_key'    => 'free_AI_credit',
                'param_label'  => 'Free AI Credit for New Agent',
                'data_type'    => 'value',
                'number_value' => 10000,
                'text_value'   => null,
                'is_active'    => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category'     => 'affiliate',
                'param_key'    => 'affiliate_commission',
                'param_label'  => 'Affiliate Commission ',
                'data_type'    => 'percent',
                'number_value' => 15,
                'text_value'   => null,
                'is_active'    => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category'     => 'affiliate',
                'param_key'    => 'ma_commission',
                'param_label'  => 'Master Affiliate Commission ',
                'data_type'    => 'percent',
                'number_value' => 10,
                'text_value'   => null,
                'is_active'    => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category'     => 'affiliate',
                'param_key'    => 'partner_commission',
                'param_label'  => 'Partner Commission ',
                'data_type'    => 'percent',
                'number_value' => 5,
                'text_value'   => null,
                'is_active'    => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('parameter_travelboosts')->insert($param_travelboost);
    }
}