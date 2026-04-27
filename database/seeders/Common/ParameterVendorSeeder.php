<?php

namespace Database\Seeders\Common;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ParameterVendorSeeder extends Seeder
{
    public function run(): void
    {

        $companies = DB::table('companies')->get();

        foreach ($companies as $company) {

            $rows = [

                [
                    'company_id' => $company->id,
                    'category'   => 'booking',
                    'param_key'  => 'last_booking_deadline',
                    'label'      => 'Last booking deadline',
                    'input_type' => 'number',
                    'sort_order' => 1,
                    'is_active'  => true,
                ],

                [
                    'company_id' => $company->id,
                    'category'   => 'booking',
                    'param_key'  => 'min_dp',
                    'label'      => 'Minimum Down Payment',
                    'input_type' => 'percent',
                    'sort_order' => 2,
                    'is_active'  => true,
                ],

                [
                    'company_id' => $company->id,
                    'category'   => 'booking',
                    'param_key'  => 'vat',
                    'label'      => 'Value-Added Tax (VAT)',
                    'input_type' => 'percent',
                    'sort_order' => 3,
                    'is_active'  => true,
                ],

                [
                    'company_id' => $company->id,
                    'category'   => 'booking',
                    'param_key'  => 'term_condition',
                    'label'      => 'Term and Condition',
                    'input_type' => 'textarea',
                    'sort_order' => 4,
                    'is_active'  => true,
                ],

                [
                    'company_id' => $company->id,
                    'category'   => 'booking',
                    'param_key'  => 'booking_entry',
                    'label'      => 'Booking Entry',
                    'input_type' => 'number',
                    'sort_order' => 5,
                    'is_active'  => true,
                ],

                /**
                 * PAYMENT GATEWAY
                 */
                [
                    'company_id' => $company->id,
                    'category'   => 'Payment Gateway',
                    'param_key'  => 'payment_gateway',
                    'label'      => 'Payment Gateway Credential',
                    'input_type' => 'json',
                    'sort_order' => 6,
                    'is_active'  => true,
                ],

                /**
                 * BANK TRANSFER
                 */
                [
                    'company_id' => $company->id,
                    'category'   => 'Bank Transfer',
                    'param_key'  => 'bank_transfer',
                    'label'      => 'Bank Account',
                    'input_type' => 'json',
                    'sort_order' => 7,
                    'is_active'  => true,
                ],

            ];

            foreach ($rows as $row) {

                $parameterId = DB::table('parameter_vendors')
                    ->updateOrInsert(
                        [
                            'company_id' => $row['company_id'],
                            'param_key'  => $row['param_key'],
                        ],
                        array_merge(
                            $row,
                            [
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]
                        )
                    );

                $parameter = DB::table('parameter_vendors')
                    ->where('company_id', $row['company_id'])
                    ->where('param_key', $row['param_key'])
                    ->first();

                /**
                 * Insert default value
                 */
                DB::table('parameter_vendors_values')
                    ->updateOrInsert(
                        [
                            'company_id'   => $company->id,
                            'parameter_id' => $parameter->id,
                        ],
                        [
                            'value' => $this->defaultValue($row['param_key']),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]
                    );
            }
        }
    }

    private function defaultValue(string $key): string
    {
        return match ($key) {

            'last_booking_deadline' => '100000',

            'min_dp' => '10',

            'vat' => '1.1',

            'term_condition' => '',

            'booking_entry' => '10',

            'payment_gateway' => json_encode([
                'username' => '',
                'password' => '',
            ]),

            'bank_transfer' => json_encode([
                'bank'  => 'BCA',
                'owner' => '',
                'norek' => '',
            ]),

            default => '',
        };
    }
}