<?php

namespace Database\Seeders\Common;

use App\Models\Currency;
use Illuminate\Database\Seeder;

class CurrencySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $currencies = [
            'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'CHF', 'IDR', 'SGD', 'MYR', 'THB',
            'VND', 'PHP', 'KRW', 'HKD', 'TWD', 'INR', 'AED', 'SAR', 'QAR', 'KWD',
            'CAD', 'AUD', 'NZD', 'BRL', 'MXN', 'NOK', 'SEK', 'DKK', 'PLN', 'CZK',
            'HUF', 'ZAR', 'EGP', 'KES',
        ];

        foreach ($currencies as $code) {
            Currency::firstOrCreate(['code' => $code]);
        }
    }
}
